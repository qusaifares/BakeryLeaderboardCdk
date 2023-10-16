import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { SQS } from '@aws-sdk/client-sqs';
import { AwsRegion } from '../types/enum/AwsRegion';

const DEFAULT_REGION = AwsRegion.US_EAST_1;

export interface AwsConfigOptions {
}

export class AwsConfig {
  public readonly region: AwsRegion;

  private secretsManager: SecretsManager;

  private sqs: SQS;

  constructor() {
    this.region = process.env.AWS_REGION as AwsRegion || DEFAULT_REGION;
  }

  public getSecretsManager(): SecretsManager {
    if (!this.secretsManager) {
      this.secretsManager = new SecretsManager();
    }
    return this.secretsManager;
  }

  public getSqs(): SQS {
    if (!this.sqs) {
      this.sqs = new SQS();
    }
    return this.sqs;
  }
}
