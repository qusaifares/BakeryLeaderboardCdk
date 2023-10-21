import { MatchSummoner, SummonerStat } from '../data/entity';

export const matchesToSummonerStat = (
  summonerId: string,
  matches: MatchSummoner[],
  originalSummonerStat?: SummonerStat,
): SummonerStat => {
  const stats = originalSummonerStat || SummonerStat.getDefault(summonerId);

  return matches.reduce((statAcc, match) => getIncrementedSummonerStat(statAcc, match), stats);
};

export const getIncrementedSummonerStat = (
  originalObject: SummonerStat,
  matchSummoner: MatchSummoner,
) => {
  const summonerStat = SummonerStat.copyOf(originalObject);
  const { matchId, summonerId } = matchSummoner;

  if (summonerStat.matchIdsTracked.includes(matchSummoner.matchId)) {
    console.log(`Already tracked match ID ${matchId} for summoner ID ${summonerId}`);
    return summonerStat;
  }

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
  summonerStat.missingPings += matchSummoner.missingPings;
  summonerStat.matchIdsTracked.push(matchId);

  return summonerStat;
};
