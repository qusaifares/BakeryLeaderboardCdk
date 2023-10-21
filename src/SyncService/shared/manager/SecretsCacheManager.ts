import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { Cache } from '../types/Cache';
import { InMemoryCache } from '../utils/InMemoryCache';

export class SecretsCacheManager {
  private readonly secretsCache: Cache<string, any>;

  constructor(private readonly secretsmanager: SecretsManager) {
    this.secretsCache = new InMemoryCache();
  }

  public async getSecret<T>(secretId: string): Promise<T> {
    const cachedSecret: T | undefined = this.secretsCache.get(secretId);

    if (cachedSecret) return cachedSecret;

    const secretValue = await this.secretsmanager.getSecretValue({ SecretId: secretId });

    if (!secretValue.SecretString) throw new Error('No secret string found.');

    const secret = JSON.parse(secretValue.SecretString);

    this.secretsCache.set(secretId, secret);

    return secret;
  }
}
