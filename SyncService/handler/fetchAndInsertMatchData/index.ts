import 'reflect-metadata';
import 'dotenv/config';
import { MatchV5DTOs } from 'twisted/dist/models-dto';
import { config } from '../../shared/config/Config';
import { Match, MatchSummoner } from '../../shared/data/entity';
import { MatchSourceStepFunctionEvent } from '../../shared/types/message/MatchSourceStepFunctionEvent';
import { validSummonerIds } from '../../shared/utils/validSummoners';
import { SyncSummonerStatsRequestEvent } from '../../shared/types/message/SyncSummonerStatsRequestEvent';
import { Position } from '../../shared/types/enum/Position';

const lambda = config.getAwsConfig().getLambda();
const riotProxy = config.getProxyConfig().getRiotProxy();

export const handler = async (event: MatchSourceStepFunctionEvent) => {
  console.log('Received event:', event);

  const { SYNC_SUMMONER_STATS_LAMBDA_ARN } = process.env;
  const { matchId } = event;
  const dataSource = await config.getManagerConfig().getDatabaseManager().getDataSource();
  const matchResponse = await riotProxy.getMatchById(matchId);

  const gameEndTimestamp = new Date((matchResponse.info as any).gameEndTimestamp);
  const match = new Match();
  match.id = matchResponse.metadata.matchId;
  match.matchData = matchResponse;
  match.gameEndTimestamp = gameEndTimestamp;
  match.gameDuration = matchResponse.info.gameDuration;

  const participants = matchResponse.info.participants
    .filter((participant) => validSummonerIds.includes(participant.summonerId));

  const matchSummoners = participants
    .map((participant) => buildMatchSummoner(matchResponse, participant));

  match.summoners = matchSummoners;

  console.log(`Built match with ${matchSummoners.length} summoners.`, match);

  const savedMatch = await dataSource.manager.save(match);

  console.log('Saved match.', savedMatch);

  // TODO: Remove this tight coupling and make SyncSummonerStatsLambda run on a timer or event
  if (SYNC_SUMMONER_STATS_LAMBDA_ARN) {
    savedMatch.summoners.forEach(async (summoner) => {
      const syncStatsLambdaPayload: SyncSummonerStatsRequestEvent = {
        matchSummoner: summoner,
      };

      await lambda.invoke({
        FunctionName: SYNC_SUMMONER_STATS_LAMBDA_ARN,
        Payload: JSON.stringify(syncStatsLambdaPayload),
      });
    });
  } else {
    console.error(`SYNC_SUMMONER_STATS_LAMBDA_ARN was not passed into function for match ID: ${matchId}`);
  }
};

function buildMatchSummoner(
  match: MatchV5DTOs.MatchDto,
  participant: MatchV5DTOs.ParticipantDto,
): MatchSummoner {
  const allyTeamParticipants = match.info.participants
    .filter((p) => p.teamId === participant.teamId);

  const enemyTeamParticipants = match.info.participants
    .filter((p) => p.teamId !== participant.teamId);

  const allyChampionIds = allyTeamParticipants
    .filter((p) => p.summonerId !== participant.summonerId)
    .map((p) => p.championId);

  const enemyChampionIds = enemyTeamParticipants.map((p) => p.championId);

  const {
    kills,
    assists,
    deaths,
    win,
    totalMinionsKilled,
    goldEarned,
    goldSpent,
    visionScore,
    summonerId,
    teamId,
    championId,
  } = participant;

  const allyTeamKills = allyTeamParticipants.reduce((acc, p) => acc + p.kills, 0);
  const allyTeamDeaths = allyTeamParticipants.reduce((acc, p) => acc + p.deaths, 0);
  const allyTeamDamageToChamps = allyTeamParticipants
    .reduce((acc, p) => acc + p.totalDamageDealtToChampions, 0);
  const allyTeamGoldEarned = allyTeamParticipants
    .reduce((acc, p) => acc + p.goldEarned, 0);

  const matchSummonerObject: Omit<MatchSummoner, 'match' | 'summoner'> = {
    matchId: match.metadata.matchId,
    summonerId,
    teamId,
    championId,
    win,
    kills,
    deaths,
    assists,
    totalMinionsKilled,
    damageToChampions: participant.totalDamageDealtToChampions,
    damageTaken: participant.totalDamageTaken,
    healingDone: participant.totalHeal,
    teamKills: allyTeamKills,
    teamDeaths: allyTeamDeaths,
    teamGoldEarned: allyTeamGoldEarned,
    teamDamageDealtToChampions: allyTeamDamageToChamps,
    goldEarned,
    goldSpent,
    visionScore,
    allyChampionIds,
    enemyChampionIds,
    gameEndTimestamp: new Date((match.info as any).gameEndTimestamp),
    gameDuration: match.info.gameDuration,
    position: participant.teamPosition as Position,
    missingPings: (participant as any).enemyMissingPings || 0,
  };

  return matchSummonerObject as MatchSummoner;
}
