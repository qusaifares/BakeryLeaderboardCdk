import { LeaderboardResponse } from '../api/models';
import { playersDataSource } from '../data/source/impl/AuroraPlayersDataSource';
import { transformPlayersToSummonerApiModels } from '../transformer/transformPlayerToApiModel';

export const getLeaderboardResponse = async (): Promise<LeaderboardResponse> => {
  const players = await playersDataSource.getPlayers();

  const transformedSummoners = transformPlayersToSummonerApiModels(players);

  console.log('Transformed summoners:', transformedSummoners);

  return {
    players: transformedSummoners,
  };
};
