import 'dotenv/config';
import { config } from '../../shared/config/Config';
import { SummonerStat } from '../../shared/data/entity';
import { Division } from '../../shared/types/enum/Division';
import { Tier } from '../../shared/types/enum/Tier';
import { SyncSummonerStatsRequestEvent } from '../../shared/types/message/SyncSummonerStatsRequestEvent';

export const handler = async (event: SyncSummonerStatsRequestEvent) => {
  const { matchSummoner } = event;
  const { summonerId } = matchSummoner;

  const riotProxy = config.getProxyConfig().getRiotProxy();
  const dataSource = await config.getManagerConfig().getDatabaseManager().getDataSource();

  const summonerStat = (await dataSource.manager
    .findOneBy(SummonerStat, { summonerId })) || new SummonerStat();

  if (!summonerStat.summonerId) summonerStat.summonerId = summonerId;

  summonerStat.wins += +matchSummoner.win;
  summonerStat.losses += +(!matchSummoner.win);
  summonerStat.kills += matchSummoner.kills;
  summonerStat.deaths += matchSummoner.deaths;
  summonerStat.assists += matchSummoner.assists;
  summonerStat.totalMinionsKilled += matchSummoner.totalMinionsKilled;
  summonerStat.damageToChampions += matchSummoner.damageToChampions;
  summonerStat.damageTaken += matchSummoner.damageTaken;
  summonerStat.healingDone += matchSummoner.healingDone;
  summonerStat.teamKills += matchSummoner.teamKills;
  summonerStat.teamDeaths += matchSummoner.teamDeaths;
  summonerStat.teamGoldEarned += matchSummoner.teamGoldEarned;
  summonerStat.teamDamageDealtToChampions += matchSummoner.teamDamageDealtToChampions;
  summonerStat.goldEarned += matchSummoner.goldEarned;
  summonerStat.goldSpent += matchSummoner.goldSpent;
  summonerStat.totalVisionScore += matchSummoner.visionScore;
  summonerStat.totalGameTime += matchSummoner.gameDuration;

  try {
    const league = await riotProxy.getSoloQueueLeagueBySummonerId(summonerId);

    if (!league) throw new Error(`Couldn't get soloq league for summoner ID: ${summonerId}`);

    summonerStat.leagueId = league.leagueId;
    summonerStat.tier = league.tier as Tier;
    summonerStat.division = league.rank as Division;
    summonerStat.leaguePoints = league.leaguePoints;
  } catch (error) {
    console.error(error);
  }

  await dataSource.manager.save(summonerStat);
};
