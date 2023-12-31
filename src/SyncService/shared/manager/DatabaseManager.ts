import path = require('path');
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { DatabaseCredentials } from '../types/DatabaseCredentials';
import {
  Match, MatchSummoner, Player, RankSnapshot, Summoner, SummonerStat,
} from '../data/entity';
import { isDevelopment } from '../utils/env';
import { SecretsCacheManager } from './SecretsCacheManager';
import { withTimeout } from '../utils/withTimeout';

const CONNECTION_TIMEOUT = 4000;
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
    engine: 'postgres',
  };

  constructor(
    private readonly secretsCacheManager: SecretsCacheManager,
  ) {
    if (!process.env.DB_SECRET) throw new Error('No secret ID');

    this.secretId = process.env.DB_SECRET;
  }

  public async getDataSource(): Promise<DataSource> {
    if (!this.dataSource) {
      const dataSourceOptions = await this.getDataSourceOptions();
      console.log(`Connecting to host ${dataSourceOptions.host}`);
      this.dataSource = new DataSource(dataSourceOptions);
    }

    if (this.dataSource.isInitialized) return this.dataSource;

    console.log('Initializing DB connection');
    const source = await this.dataSource.initialize();
    console.log('Successfully connected to DB.', source);

    return source;
  }

  private async getDataSourceOptions(): Promise<PostgresConnectionOptions> {
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
      synchronize: true || isDevelopment,
      logging: true,
      entities: [Match, MatchSummoner, Player, Summoner, RankSnapshot, SummonerStat],
      subscribers: [path.join(__dirname, '../data/subscriber/*{.ts,.js}')],
      migrations: [path.join(__dirname, '../data/migration/*{.ts,.js}')],
      connectTimeoutMS: 4000,
      logger: 'debug',
      poolSize: 100,
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
