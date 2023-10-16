import 'reflect-metadata';
import { SendMessageBatchCommandInput } from '@aws-sdk/client-sqs';
import { config } from '../../shared/config/Config';
import { Summoner } from '../../shared/data/entities';
import { chunkArray } from '../../shared/utils/chunkArray';
import { SummonerMatchFetchRequetMessage } from '../../shared/types/message/SummonerMatchFetchRequestMessage';

const BATCH_SIZE = 10;
const MATCH_HISTORY_LOOKBACK_PERIOD_IN_HOURS = 1;

export const handler = async () => {
  console.log('Invoking HANDLER');
  const { SUMMONER_MATCH_FETCH_REQUEST_QUEUE_URL } = process.env;
  if (!SUMMONER_MATCH_FETCH_REQUEST_QUEUE_URL) {
    console.log('SUMMONER_MATCH_FETCH_REQUEST_QUEUE_URL not found');
    return;
  }

  const databaseManager = config.getManagerConfig().getDatabaseManager();
  const sqs = config.getAwsConfig().getSqs();

  const dataSource = await databaseManager.getDataSource();

  const summoners = await dataSource.manager.find(Summoner);

  console.log(`Executing sourceMatches for ${summoners.length} summoners`);

  const summonerPuuidMessageChunks: SummonerMatchFetchRequetMessage[][] = chunkArray(summoners
    .map((summoner) => ({
      puuid: summoner.puuid,
      lookbackPeriodInHours: MATCH_HISTORY_LOOKBACK_PERIOD_IN_HOURS,
    })), BATCH_SIZE);

  const entryChunks = summonerPuuidMessageChunks
    .map((messages) => messages
      .map((message, i) => ({ Id: `${i}`, MessageBody: JSON.stringify(message) })));

  const chunkedMessages: SendMessageBatchCommandInput[] = entryChunks
    .map((entries) => ({
      QueueUrl: SUMMONER_MATCH_FETCH_REQUEST_QUEUE_URL,
      Entries: entries,
    }));

  chunkedMessages.forEach(async (message) => {
    try {
      const result = await sqs.sendMessageBatch(message);
      console.log('Batch sent: ', result);
    } catch (error) {
      console.error('Error sending batch: ', error);
    }
  });
};
