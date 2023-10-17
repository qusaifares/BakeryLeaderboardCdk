import 'dotenv/config';
import { config } from '../../shared/config/Config';
import { Match } from '../../shared/data/entity';
import { MatchSourceStepFunctionEvent } from '../../shared/types/message/MatchSourceStepFunctionEvent';

interface CheckMatchExistenceLambdaResult {
  doesMatchExist: boolean;
}

export const handler = async (event: MatchSourceStepFunctionEvent):
Promise<CheckMatchExistenceLambdaResult> => {
  const { matchId } = event;

  const databaseManager = config.getManagerConfig().getDatabaseManager();
  const dataSource = await databaseManager.getDataSource();

  console.log(`Fetching match with ID ${matchId} from Riot API`);

  const match = await dataSource.manager.findOneBy(Match, { id: matchId });

  return { doesMatchExist: !!match };
};
