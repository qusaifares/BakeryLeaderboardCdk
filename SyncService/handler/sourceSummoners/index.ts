import { config } from '../../shared/config/Config';
import { Player, Summoner } from '../../shared/data/entities';
import seedData from './summonerSeedData.json';

export const handler = () => {
  const databaseManager = config.getManagerConfig().getDatabaseManager();
  const riotProxy = config.getProxyConfig().getRiotProxy();

  const { players } = seedData;

  players.forEach(async (playerSeedData) => {
    const summonerResponses = await Promise
      .all(playerSeedData.summonerNames.map(riotProxy.getSummonerByName));

    const summoners: Summoner[] = summonerResponses.map((res) => {
      const summoner = new Summoner();
      summoner.summonerId = res.id;
      summoner.accountId = res.accountId;
      summoner.puuid = res.puuid;
      summoner.profileIconId = res.profileIconId;
      summoner.summonerLevel = res.summonerLevel;
      summoner.name = res.name;

      return summoner;
    });

    const player = new Player();
    player.discordId = playerSeedData.discordId;
    player.keyWords = playerSeedData.keywords;
    player.summoners = summoners;

    const dataSource = await databaseManager.getDataSource();

    dataSource.manager.save(player);
  });
};
