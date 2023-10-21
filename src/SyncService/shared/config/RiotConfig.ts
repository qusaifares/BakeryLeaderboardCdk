import { RegionGroups, Regions, regionToRegionGroup } from 'twisted/dist/constants';
import { SecretsCacheManager } from '../manager/SecretsCacheManager';
import { RiotApiSecret } from '../types/RiotApiSecret';

export class RiotConfig {
  private apiKey: string;

  public readonly region: Regions;

  public readonly regionGroup: RegionGroups;

  public readonly soloQueueId: number;

  public readonly soloQueueType: string;

  constructor(private readonly secretsCacheManager: SecretsCacheManager) {
    this.region = Regions.AMERICA_NORTH;
    this.regionGroup = regionToRegionGroup(this.region);
    this.soloQueueId = 420;
    this.soloQueueType = 'RANKED_SOLO_5x5';
  }

  async getApiKey() {
    if (!process.env.RIOT_API_SECRET) {
      throw new Error('RIOT_API_SECRET not passed in as environment variable');
    }

    if (!this.apiKey) {
      const riotApiSecret = await this.secretsCacheManager
        .getSecret<RiotApiSecret>(process.env.RIOT_API_SECRET);

      const { apiKey } = riotApiSecret;

      if (!apiKey) {
        throw new Error('Unable to get Riot API key from SecretsCacheManager');
      }

      this.apiKey = apiKey;
    }

    return this.apiKey;
  }
}
