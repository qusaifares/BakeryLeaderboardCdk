import 'reflect-metadata';
import 'dotenv/config';
import { SendMessageBatchCommandInput, SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { Handler } from 'aws-lambda';
import { FindManyOptions, In } from 'typeorm';
import { config } from '../../shared/config/Config';
import { Summoner } from '../../shared/data/entity';
import { chunkArray } from '../../shared/utils/chunkArray';
import { SummonerMatchFetchRequetMessage as SummonerMatchFetchRequestMessage } from '../../shared/types/message/SummonerMatchFetchRequestMessage';
import { SourceMatchesEvent, SourceMatchesEventType } from '../../shared/types/message/SourceMatchesEvent';
import { TimeMeasurement } from '../../shared/utils/TimeMeasurement';

const BATCH_SIZE = 10;

const sqs = config.getAwsConfig().getSqs();

export const handler: Handler<SourceMatchesEvent> = async (event) => {
  console.log('Received event:', event);
  const { SUMMONER_MATCH_FETCH_REQUEST_QUEUE_URL } = process.env;
  if (!SUMMONER_MATCH_FETCH_REQUEST_QUEUE_URL) {
    throw new Error('SUMMONER_MATCH_FETCH_REQUEST_QUEUE_URL not found');
  }

  const { summonerIds } = event;

  const queryOptions: FindManyOptions = summonerIds ? { where: In(summonerIds) } : {};

  const dataSource = await config.getManagerConfig().getDatabaseManager().getDataSource();

  const summoners = await dataSource.manager.find(Summoner, queryOptions);

  console.log(`Executing sourceMatches for ${summoners.length} summoners`);

  let lookbackPeriodInHours: number;

  if (event.type === SourceMatchesEventType.INTERVAL) {
    const { days = 0, hours = 0, minutes = 0 } = event.interval;

    lookbackPeriodInHours = TimeMeasurement
      .ofDays(days)
      .plusHours(hours)
      .plusMinutes(minutes)
      .toHours();
  } else {
    const { startEpochMilli } = event;
    const currentEpoch = Date.now();

    if (startEpochMilli > currentEpoch) {
      throw new Error(`Start epoch (${startEpochMilli}) can't be greater than current epoch ${currentEpoch}`);
    }
    lookbackPeriodInHours = TimeMeasurement
      .ofMilliSeconds(Date.now() - event.startEpochMilli)
      .toHours();
  }

  const summonerPuuidMessageChunks: SummonerMatchFetchRequestMessage[][] = chunkArray(summoners
    .map((summoner) => ({
      puuid: summoner.puuid,
      lookbackPeriodInHours,
    })), BATCH_SIZE);

  const entryChunks: SendMessageBatchRequestEntry[][] = summonerPuuidMessageChunks
    .map((messages) => messages
      .map<SendMessageBatchRequestEntry>((message, i) => ({ Id: `${i}`, MessageBody: JSON.stringify(message) })));

  const chunkedMessages: SendMessageBatchCommandInput[] = entryChunks
    .map((entries) => ({
      QueueUrl: SUMMONER_MATCH_FETCH_REQUEST_QUEUE_URL,
      Entries: entries,
    }));

  console.log('Messages to send:', chunkedMessages);

  return Promise.allSettled(chunkedMessages.map(async (message) => {
    try {
      const result = await sqs.sendMessageBatch(message);
      console.log('Batch sent: ', result);
      return result;
    } catch (error) {
      console.error('Error sending batch: ', error);
      throw error;
    }
  }));
};
