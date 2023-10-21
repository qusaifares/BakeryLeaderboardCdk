import { DatabaseManager } from '../manager/DatabaseManager';
import { AwsConfig } from './AwsConfig';

export class ManagerConfig {
  private databaseManager: DatabaseManager;

  constructor(
    private readonly awsConfig: AwsConfig,
  ) {}

  public getDatabaseManager(): DatabaseManager {
    if (!this.databaseManager) {
      this.databaseManager = new DatabaseManager(this.awsConfig.getSecretsCacheManager());
    }

    return this.databaseManager;
  }
}
