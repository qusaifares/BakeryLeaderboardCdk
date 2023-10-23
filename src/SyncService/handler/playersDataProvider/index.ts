import { Handler } from 'aws-lambda';
import { config } from '../../shared/config/Config';
import { Player } from '../../shared/data/entity';

export interface PlayersLambdaRequest {
}

export interface PlayersLambdaResponse {
  players: Player[];
}

export const handler: Handler<PlayersLambdaRequest, PlayersLambdaResponse> = async () => {
  const dataSource = await config.getManagerConfig().getDatabaseManager().getDataSource();

  const players = await dataSource.manager.find(Player);

  return { players };
};
