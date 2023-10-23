import { Player } from '../../../../shared/data/entity';

export interface PlayersDataSource {
  getPlayers(): Promise<Player[]>;
}
