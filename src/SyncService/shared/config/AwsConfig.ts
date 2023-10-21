import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { SQS } from '@aws-sdk/client-sqs';
import { SFN } from '@aws-sdk/client-sfn';
import { Lambda } from '@aws-sdk/client-lambda';
import { AwsRegion } from '../types/enum/AwsRegion';
import { SecretsCacheManager } from '../manager/SecretsCacheManager';

const DEFAULT_REGION = AwsRegion.US_EAST_2;

export interface AwsConfigOptions {
}

export class AwsConfig {
  public readonly region: AwsRegion;

  private secretsManager: SecretsManager;

  private sqs: SQS;

  private stepFunctions: SFN;

  private lambda: Lambda;

  private secretsCacheManager: SecretsCacheManager;

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

  public getStepFunctions(): SFN {
    if (!this.stepFunctions) {
      this.stepFunctions = new SFN();
    }
    return this.stepFunctions;
  }

  public getLambda(): Lambda {
    if (!this.lambda) {
      this.lambda = new Lambda();
    }
    return this.lambda;
  }

  public getSecretsCacheManager() {
    if (!this.secretsCacheManager) {
      this.secretsCacheManager = new SecretsCacheManager(this.getSecretsManager());
    }
    return this.secretsCacheManager;
  }
}
