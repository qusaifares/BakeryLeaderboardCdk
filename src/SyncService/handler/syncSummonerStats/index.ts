import 'dotenv/config';
import { config } from '../../shared/config/Config';
import { SummonerStat } from '../../shared/data/entity';
import { Division } from '../../shared/types/enum/Division';
import { Tier } from '../../shared/types/enum/Tier';
import { SyncSummonerStatsRequestEvent } from '../../shared/types/message/SyncSummonerStatsRequestEvent';
import { getIncrementedSummonerStat } from '../../shared/utils/incrementMatchStats';
import { TimeMeasurement } from '../../shared/utils/TimeMeasurement';

const riotProxy = config.getProxyConfig().getRiotProxy();

const INTERVAL_BEFORE_RANK_UPDATE = TimeMeasurement.ofMinutes(25);
export const handler = async (event: SyncSummonerStatsRequestEvent) => {
  console.log('Event received:', event);

  const { matchSummoner } = event;
  const { summonerId } = matchSummoner;

  const dataSource = await config.getManagerConfig().getDatabaseManager().getDataSource();

  console.log(`Searching for SummonerStat with ID: ${summonerId}`);

  const originalSummonerStat = (await dataSource.manager
    .findOneBy(SummonerStat, { summonerId })) || SummonerStat.getDefault(summonerId);

  console.log('Found/created SummonerStat:', originalSummonerStat);

  if (!originalSummonerStat.summonerId) originalSummonerStat.summonerId = summonerId;

  const summonerStat = getIncrementedSummonerStat(originalSummonerStat, matchSummoner);

  try {
    const rankLastUpdated = summonerStat.rankLastUpdated.getTime();
    const currentEpoch = Date.now();

    const rankUpdateWaitTarget = INTERVAL_BEFORE_RANK_UPDATE.plusMilliseconds(rankLastUpdated);

    const hasWaitTimePassed = currentEpoch > rankUpdateWaitTarget.toMilliSeconds();

    const shouldUpdateRank = hasWaitTimePassed || !summonerStat.tier;
    if (shouldUpdateRank) {
      const league = await riotProxy.getSoloQueueLeagueBySummonerId(summonerId);

      if (!league) throw new Error(`Couldn't get soloq league for summoner ID: ${summonerId}`);

      summonerStat.leagueId = league.leagueId;
      summonerStat.tier = league.tier as Tier;
      summonerStat.division = league.rank as Division;
      summonerStat.leaguePoints = league.leaguePoints;
      summonerStat.rankLastUpdated = new Date();
    }
  } catch (error) {
    console.error(error);
  }

  const savedSummonerStat = dataSource.manager.save(summonerStat);

  console.log('Saved SummonerStat:', savedSummonerStat);

  return savedSummonerStat;
};
