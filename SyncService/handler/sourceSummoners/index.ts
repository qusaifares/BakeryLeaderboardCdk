import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { config } from '../../shared/config/Config';
import { Player, Summoner } from '../../shared/data/entity';
import seedData from './summonerSeedData.json';

const databaseManager = config.getManagerConfig().getDatabaseManager();
const riotProxy = config.getProxyConfig().getRiotProxy();

export const handler = async () => {
  console.log('Before datasource');

  let dataSource: DataSource;
  try {
    dataSource = await databaseManager.getDataSource();
  } catch (error) {
    console.error('Unable to get data source.', error);
    throw new Error('Unable to get database connection.');
  }

  const { players } = seedData;

  const response = await Promise.allSettled(players.map(async (playerSeedData) => {
    try {
      const summonerResponses = await Promise
        .all(playerSeedData.summonerNames
          .map(riotProxy.getSummonerByName.bind(riotProxy)));

      const summoners: Summoner[] = summonerResponses.map((res) => {
        const summoner = new Summoner();
        summoner.id = res.id;
        summoner.accountId = res.accountId;
        summoner.puuid = res.puuid;
        summoner.profileIconId = res.profileIconId;
        summoner.summonerLevel = res.summonerLevel;
        summoner.name = res.name;
        summoner.shouldDisplay = true;

        return summoner;
      });

      const player = new Player();
      player.discordId = playerSeedData.discordId;
      player.name = playerSeedData.name;
      player.keyWords = playerSeedData.keywords;
      player.summoners = summoners;

      const savedPlayer = await dataSource.manager.save(player);

      console.log(`Saved Player: ${savedPlayer.name}`, savedPlayer);

      return savedPlayer;
    } catch (error) {
      console.log(`Failed to get and save player data for player: ${playerSeedData.name}`, error);
    }
  }));

  return response;
};
