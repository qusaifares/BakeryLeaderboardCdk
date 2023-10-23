import 'reflect-metadata';
import 'dotenv/config';
import { config } from '../../shared/config/Config';
import { Match } from '../../shared/data/entity';
import { MatchSourceStepFunctionEvent } from '../../shared/types/message/MatchSourceStepFunctionEvent';

interface CheckMatchExistenceLambdaResult {
  doesMatchExist: boolean;
  matchId: string;
}

const databaseManager = config.getManagerConfig().getDatabaseManager();
export const handler = async (event: MatchSourceStepFunctionEvent):
Promise<CheckMatchExistenceLambdaResult> => {
  console.log('Received event:', event);
  const { matchId } = event;

  if (!matchId) {
    throw new Error('No matchId passed in to request.');
  }

  const dataSource = await databaseManager.getDataSource();

  console.log(`Fetching match with ID ${matchId} from DB`);

  const match = await dataSource.manager.findOneBy(Match, { id: matchId });

  console.log('Match result:', match);

  return { doesMatchExist: !!match, matchId };
};
