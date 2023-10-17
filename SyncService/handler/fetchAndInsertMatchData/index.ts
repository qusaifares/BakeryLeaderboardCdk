import 'dotenv/config';
import { MatchV5DTOs } from 'twisted/dist/models-dto';
import { config } from '../../shared/config/Config';
import { Match, MatchSummoner } from '../../shared/data/entity';
import { MatchSourceStepFunctionEvent } from '../../shared/types/message/MatchSourceStepFunctionEvent';
import { validSummonerIds } from '../../shared/utils/validSummoners';
import { SyncSummonerStatsRequestEvent } from '../../shared/types/message/SyncSummonerStatsRequestEvent';

export const handler = async (event: MatchSourceStepFunctionEvent) => {
  const { SYNC_SUMMONER_STATS_LAMBDA_ARN } = process.env;
  const { matchId } = event;
  const riotProxy = config.getProxyConfig().getRiotProxy();
  const dataSource = await config.getManagerConfig().getDatabaseManager().getDataSource();
  const matchResponse = await riotProxy.getMatchById(matchId);
  const lambda = config.getAwsConfig().getLambda();

  const match = new Match();
  match.id = matchResponse.metadata.matchId;
  match.matchData = matchResponse;
  match.gameCreationTime = matchResponse.info.gameCreation;
  match.gameDuration = matchResponse.info.gameDuration;

  const participants = matchResponse.info.participants
    .filter((participant) => validSummonerIds.includes(participant.summonerId));

  const matchSummoners = participants
    .map((participant) => buildMatchSummoner(matchResponse, participant));

  match.summoners = matchSummoners;

  const savedMatch = await dataSource.manager.save(match);

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

  const matchSummonerObject: Omit<MatchSummoner, 'match'> = {
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
    gameCreationTime: match.info.gameCreation,
    gameDuration: match.info.gameDuration,
  };

  return matchSummonerObject as MatchSummoner;
}
