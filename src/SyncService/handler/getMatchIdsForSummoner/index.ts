import 'reflect-metadata';
import 'dotenv/config';
import {
  SQSHandler, SQSRecord,
} from 'aws-lambda';
import { SendMessageBatchCommandInput, SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { SummonerMatchFetchRequetMessage as SummonerMatchFetchRequestMessage } from '../../shared/types/message/SummonerMatchFetchRequestMessage';
import { config } from '../../shared/config/Config';
import { chunkArray } from '../../shared/utils/chunkArray';
import { FetchMatchRequestMessage } from '../../shared/types/message/FetchMatchRequestMessage';
import { TimeMeasurement } from '../../shared/utils/TimeMeasurement';

const BATCH_SIZE = 10;

const riotProxy = config.getProxyConfig().getRiotProxy();
const sqs = config.getAwsConfig().getSqs();

type HandleRecordResult = HandleRecordSuccessResult | HandleRecordFailResult;

interface HandleRecordSuccessResult {
  success: true;
  matchIds: string[];
}
interface HandleRecordFailResult {
  success: false;
  messageId: string;
}

const handleRecord = async (record: SQSRecord): Promise<HandleRecordResult> => {
  const message: SummonerMatchFetchRequestMessage = JSON.parse(record.body);

  try {
    const matchIds = await riotProxy.getMatchIdsByPuuid(
      message.puuid,
      TimeMeasurement.ofHours(message.lookbackPeriodInHours),
    );

    return { matchIds, success: true };
  } catch (error) {
    return { success: false, messageId: record.messageId };
  }
};

export const handler: SQSHandler = async (event) => {
  console.log('Received event:', event);
  const { FETCH_MATCH_QUEUE_URL } = process.env;

  if (!FETCH_MATCH_QUEUE_URL) {
    throw new Error(`FETCH_MATCH_QUEUE_URL was not passed in for event: ${event}`);
  }

  // Get all match IDs
  const handleRecordResults: HandleRecordResult[] = await Promise
    .all(event.Records.map(handleRecord));

  const matchIds = handleRecordResults.flatMap((res) => (res.success ? res.matchIds : []));

  const uniqueMatchIds = [...new Set(matchIds)];

  console.log(`Received ${matchIds.length} match IDs, ${uniqueMatchIds.length} of which are unique.`, uniqueMatchIds);

  const matchIdMessages: FetchMatchRequestMessage[] = uniqueMatchIds
    .map((matchId) => ({ matchId }));

  const messageChunks: FetchMatchRequestMessage[][] = chunkArray(matchIdMessages, BATCH_SIZE);

  const entryChunks: SendMessageBatchRequestEntry[][] = messageChunks
    .map((chunk) => chunk.map((entry, i) => ({ Id: `${i}`, MessageBody: JSON.stringify(entry) })));

  const batchedMessages: SendMessageBatchCommandInput[] = entryChunks.map((entryChunk) => ({
    QueueUrl: FETCH_MATCH_QUEUE_URL,
    Entries: entryChunk,
  }));

  console.log(`Sending ${batchedMessages.length} batch messages`);

  await Promise.allSettled(batchedMessages.map(async (batch) => {
    try {
      const result = await sqs.sendMessageBatch(batch);
      console.log('Sent batch message. ', result);
      return result;
    } catch (error) {
      console.error('Failed to send batch message. ', error);
      throw error;
    }
  }));

  const failedRecords: HandleRecordFailResult[] = handleRecordResults
    .filter((res) => !res.success) as HandleRecordFailResult[];

  const batchItemFailures = failedRecords.map((res) => ({ itemIdentifier: res.messageId }));

  return { batchItemFailures };
};
