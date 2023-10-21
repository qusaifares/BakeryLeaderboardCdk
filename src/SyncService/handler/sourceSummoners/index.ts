import 'reflect-metadata';
import 'dotenv/config';
import { config } from '../../shared/config/Config';
import { Player, Summoner } from '../../shared/data/entity';
import seedData from './summonerSeedData.json';

const databaseManager = config.getManagerConfig().getDatabaseManager();
const riotProxy = config.getProxyConfig().getRiotProxy();

export const handler = async () => {
  console.log('Before datasource');

  const dataSource = await databaseManager.getDataSource();

  const { players } = seedData;

  const successfullyBuiltPlayers = (await Promise
    .allSettled(players.map(buildPlayer)))
    .filter((p) => p.status === 'fulfilled') as PromiseFulfilledResult<Player>[];

  const builtPlayers = successfullyBuiltPlayers.map((player) => player.value);

  console.log('Saving players:', builtPlayers);

  const savedPlayers = await dataSource.manager.save(builtPlayers);

  return savedPlayers;
};

async function buildPlayer(playerSeedData: typeof seedData.players[0]) {
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

  return player;
}
