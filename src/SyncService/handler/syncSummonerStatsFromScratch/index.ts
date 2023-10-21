import 'dotenv/config';
import { config } from '../../shared/config/Config';
import { MatchSummoner } from '../../shared/data/entity';
import { Division } from '../../shared/types/enum/Division';
import { Tier } from '../../shared/types/enum/Tier';
import { SyncSummonerStatsFromScratchRequestEvent } from '../../shared/types/message/SyncSummonerStatsFromScratchRequestEvent';
import { matchesToSummonerStat } from '../../shared/utils/incrementMatchStats';

const riotProxy = config.getProxyConfig().getRiotProxy();

// const INTERVAL_BEFORE_RANK_UPDATE = TimeMeasurement.ofMinutes(25);
export const handler = async (event: SyncSummonerStatsFromScratchRequestEvent) => {
  console.log('Event received:', event);

  const { summonerId } = event;

  const dataSource = await config.getManagerConfig().getDatabaseManager().getDataSource();

  console.log(`Searching for SummonerStat with ID: ${summonerId}`);

  const allSummonerMatches = await dataSource.manager.findBy(MatchSummoner, { summonerId });

  const summonerStat = matchesToSummonerStat(summonerId, allSummonerMatches);

  console.log('Created SummonerStat:', summonerStat);

  try {
    const league = await riotProxy.getSoloQueueLeagueBySummonerId(summonerId);

    if (!league) throw new Error(`Couldn't get soloq league for summoner ID: ${summonerId}`);

    summonerStat.leagueId = league.leagueId;
    summonerStat.tier = league.tier as Tier;
    summonerStat.division = league.rank as Division;
    summonerStat.leaguePoints = league.leaguePoints;
    summonerStat.rankLastUpdated = new Date();
  } catch (error) {
    console.error(error);
  }

  const savedSummonerStat = await dataSource.manager.save(summonerStat);

  console.log('Saved SummonerStat:', savedSummonerStat);

  return savedSummonerStat;
};
