import { SQSEvent } from 'aws-lambda';
import { SendMessageBatchCommandInput, SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { SummonerMatchFetchRequetMessage } from '../../shared/types/message/SummonerMatchFetchRequestMessage';
import { config } from '../../shared/config/Config';
import { TimeMeasurement } from '../../shared/utils/TimeMeasurement';
import { chunkArray } from '../../shared/utils/chunkArray';
import { FetchMatchRequestMessage } from '../../shared/types/message/FetchMatchRequestMessage';

const BATCH_SIZE = 10;

export const handler = async (event: SQSEvent) => {
  const { FETCH_MATCH_QUEUE_URL } = process.env;

  if (!FETCH_MATCH_QUEUE_URL) {
    console.log('FETCH_MATCH_QUEUE_URL was not passed in for event: ', event);
    return;
  }

  const riotProxy = config.getProxyConfig().getRiotProxy();
  const sqs = config.getAwsConfig().getSqs();

  // Get all match IDs
  const matchIds: string[] = (await Promise.all(event.Records.map(async (record) => {
    const message: SummonerMatchFetchRequetMessage = JSON.parse(record.body);

    return riotProxy.getMatchIdsByPuuid(
      message.puuid,
      TimeMeasurement.ofHours(message.lookbackPeriodInHours),
    );
  }))).flat(1);

  const uniqueMatchIds = [...new Set(matchIds)];

  const matchIdMessages: FetchMatchRequestMessage[] = uniqueMatchIds
    .map((matchId) => ({ matchId }));

  const messageChunks: FetchMatchRequestMessage[][] = chunkArray(matchIdMessages, BATCH_SIZE);

  const entryChunks: SendMessageBatchRequestEntry[][] = messageChunks
    .map((chunk) => chunk.map((entry, i) => ({ Id: `${i}`, MessageBody: JSON.stringify(entry) })));

  const batchedMessages: SendMessageBatchCommandInput[] = entryChunks.map((entryChunk) => ({
    QueueUrl: FETCH_MATCH_QUEUE_URL,
    Entries: entryChunk,
  }));

  batchedMessages.forEach(async (batch) => {
    try {
      const result = await sqs.sendMessageBatch(batch);
      console.log('Sent batch message. ', result);
    } catch (error) {
      console.error('Failed to send batch message. ', error);
    }
  });
};
