import { DataSource, DataSourceOptions } from 'typeorm';
import path = require('path');
import { DatabaseCredentials } from '../types/DatabaseCredentials';
import {
  Match, MatchSummoner, Player, RankSnapshot, Summoner, SummonerStat,
} from '../data/entity';
import { isDevelopment } from '../utils/env';
import { SecretsCacheManager } from './SecretsCacheManager';

export class DatabaseManager {
  // only initialize this if database is used
  private dataSource: DataSource;

  private readonly secretId: string;

  private readonly developmentDbCredentials: DatabaseCredentials = {
    host: process.env.DB_HOST as string,
    username: process.env.DB_USERNAME as string,
    password: process.env.DB_PASSWORD as string,
    port: +(process.env.DB_PORT || 5432),
    dbname: process.env.DB_NAME as string,
  };

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
      username, password, host, dbname: database, port,
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
      entities: [Match, MatchSummoner, Player, Summoner, RankSnapshot, SummonerStat],
      subscribers: [path.join(__dirname, '../data/subscriber/*{.ts,.js}')],
      migrations: [path.join(__dirname, '../data/migration/*{.ts,.js}')],
    };
  }

  private async getDbCredentials(): Promise<DatabaseCredentials> {
    if (isDevelopment) {
      console.log('Providing development DB credentials.');
      return this.developmentDbCredentials;
    }

    if (!process.env.DB_SECRET) throw new Error('process.env.DB_SECRET does not exist.');

    const dbCredentials = await this
      .secretsCacheManager.getSecret<DatabaseCredentials>(this.secretId);

    console.log('Database credentials included in secret:', Object.keys(dbCredentials));

    return dbCredentials;
  }
}

export default DatabaseManager;
