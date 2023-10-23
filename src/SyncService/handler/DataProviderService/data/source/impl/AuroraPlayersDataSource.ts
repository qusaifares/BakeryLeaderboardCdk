import { config } from '../../../../../shared/config/Config';
import { Player } from '../../../../../shared/data/entity';
import { PlayersDataSource } from '../PlayersDataSource';

export class AuroraPlayersDataSource implements PlayersDataSource {
  async getPlayers(): Promise<Player[]> {
    const dataSource = await config.getManagerConfig().getDatabaseManager().getDataSource();

    console.log('Fetching all players');
    return dataSource.manager.find(Player, { relations: ['summoners', 'summoners.matches'] });
  }
}

export const playersDataSource = new AuroraPlayersDataSource();
