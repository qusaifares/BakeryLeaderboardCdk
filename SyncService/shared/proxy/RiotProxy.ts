import { LolApi } from 'twisted/dist/apis/lol/lol';
import { RiotConfig } from '../config/RiotConfig';
import { TimeMeasurement } from '../utils/TimeMeasurement';

export class RiotProxy {
  private lolApi: LolApi;

  constructor(private readonly config: RiotConfig) {
  }

  private async getLolApi(): Promise<LolApi> {
    if (!this.lolApi) {
      this.lolApi = new LolApi({ key: await this.config.getApiKey() });
    }
    return this.lolApi;
  }

  async getSummonerByName(summonerName: string) {
    const lolApi = await this.getLolApi();
    return (await lolApi.Summoner.getByName(summonerName, this.config.region)).response;
  }

  async getMatchIdsByPuuid(puuid: string, interval: TimeMeasurement) {
    const currentEpochSeconds = Math.floor(Date.now() / 1000);
    const startTime = currentEpochSeconds - interval.toSeconds();

    const lolApi = await this.getLolApi();

    return (await lolApi.MatchV5
      .list(
        puuid,
        this.config.regionGroup,
        {
          queue: this.config.soloQueueId,
          startTime,
        },
      )).response;
  }

  async getMatchById(id: string) {
    const lolApi = await this.getLolApi();

    return (await lolApi.MatchV5.get(id, this.config.regionGroup)).response;
  }

  async getLeaguesBySummonerId(summonerId: string) {
    const lolApi = await this.getLolApi();

    return (await lolApi.League.bySummoner(summonerId, this.config.region)).response;
  }

  async getSoloQueueLeagueBySummonerId(summonerId: string) {
    const lolApi = await this.getLolApi();

    const leagues = (await lolApi.League.bySummoner(summonerId, this.config.region)).response;

    return leagues.find((league) => league.queueType === this.config.soloQueueType) || null;
  }
}
