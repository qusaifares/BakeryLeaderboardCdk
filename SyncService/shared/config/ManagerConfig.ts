import { DatabaseManager } from '../manager/DatabaseManager';
import { SecretsCacheManager } from '../manager/SecretsCacheManager';
import { AwsConfig } from './AwsConfig';
import { ProxyConfig } from './ProxyConfig';
import { RiotConfig } from './RiotConfig';

export class ManagerConfig {
  private databaseManager: DatabaseManager;

  private secretsCacheManager: SecretsCacheManager;

  constructor(
    private readonly awsConfig: AwsConfig,
    private readonly riotConfig: RiotConfig,
    private readonly proxyConfig: ProxyConfig,
  ) {}

  public getDatabaseManager(): DatabaseManager {
    if (!this.databaseManager) {
      this.databaseManager = new DatabaseManager(this.getSecretsCacheManager());
    }

    return this.databaseManager;
  }

  public getSecretsCacheManager() {
    if (!this.secretsCacheManager) {
      this.secretsCacheManager = new SecretsCacheManager(this.awsConfig.getSecretsManager());
    }
    return this.secretsCacheManager;
  }
}
