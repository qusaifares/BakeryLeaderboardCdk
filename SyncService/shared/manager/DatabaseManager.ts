import { DataSource, DataSourceOptions } from 'typeorm';
import { DatabaseCredentials } from '../types/DatabaseCredentials';
import {
  Match, MatchSummoner, Player, Summoner,
} from '../data/entities';
import { isDevelopment } from '../utils/env';
import { SecretsCacheManager } from './SecretsCacheManager';

export class DatabaseManager {
  // only initialize this if database is used
  private dataSource: DataSource;

  private readonly secretId: string;

  constructor(
    private readonly secretsCacheManager: SecretsCacheManager,
  ) {
    if (!process.env.DB_SECRET) throw new Error('No secret ID');

    this.secretId = process.env.DB_SECRET;
  }

  public async getDataSource(): Promise<DataSource> {
    if (this.dataSource.isInitialized) return this.dataSource;

    const dataSourceOptions = await this.getDataSourceOptions();
    this.dataSource = new DataSource(dataSourceOptions);
    return this.dataSource.initialize();
  }

  private async getDataSourceOptions(): Promise<DataSourceOptions> {
    const {
      username, password, host, dbName: database, port,
    } = await this.getDbCredentials();
    return {
      type: 'postgres',
      host,
      port,
      username,
      password,
      database,
      synchronize: isDevelopment,
      logging: true,
      entities: [Match, MatchSummoner, Player, Summoner],
      subscribers: [],
      migrations: [],
    };
  }

  private async getDbCredentials(): Promise<DatabaseCredentials> {
    if (!process.env.DB_SECRET) throw new Error('process.env.DB_SECRET does not exist.');

    const dbCredentials = await this
      .secretsCacheManager.getSecret<DatabaseCredentials>(this.secretId);

    return dbCredentials;
  }
}

export default DatabaseManager;
