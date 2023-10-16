import { Cache } from '../types/Cache';
import { DatabaseCredentials } from '../types/DatabaseCredentials';

export class InMemoryCache<K extends keyof any, V> implements Cache<K, V> {
  private readonly cache: Map<K, V> = new Map();

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const databaseCredentialsCache = new InMemoryCache<string, DatabaseCredentials>();
