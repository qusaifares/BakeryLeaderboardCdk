import { LolApi } from 'twisted/dist/apis/lol/lol';
import { RiotConfig } from '../config/RiotConfig';
import { TimeMeasurement } from '../utils/TimeMeasurement';

export class RiotProxy {
  private lolApi: LolApi;

  constructor(private readonly config: RiotConfig) {
  }

  private async getLolApi(): Promise<LolApi> {
    if (!this.lolApi) {
      const apiKey = (await this.config.getApiKey()).trim();
      this.lolApi = new LolApi({ key: apiKey });
    }
    return this.lolApi;
  }

  async getSummonerByName(summonerName: string) {
    const lolApi = await this.getLolApi();
    const { response } = await lolApi.Summoner.getByName(summonerName, this.config.region);
    console.log('getSummonerByName response:', response);
    return response;
  }

  async getMatchIdsByPuuid(puuid: string, interval: TimeMeasurement) {
    const currentEpochSeconds = Math.floor(Date.now() / 1000);
    const startTime = currentEpochSeconds - interval.toSeconds();

    const lolApi = await this.getLolApi();

    const { response } = await lolApi.MatchV5
      .list(
        puuid,
        this.config.regionGroup,
        {
          queue: this.config.soloQueueId,
          startTime,
        },
      );
    console.log('getMatchIdsByPuuid response:', response);
    return response;
  }

  async getMatchById(id: string) {
    const lolApi = await this.getLolApi();

    const { response } = await lolApi.MatchV5.get(id, this.config.regionGroup);
    console.log('getMatchById response:', response);
    return response;
  }

  async getLeaguesBySummonerId(summonerId: string) {
    const lolApi = await this.getLolApi();

    const { response } = await lolApi.League.bySummoner(summonerId, this.config.region);
    console.log('getLeaguesBySummonerId response:', response);
    return response;
  }

  async getSoloQueueLeagueBySummonerId(summonerId: string) {
    const lolApi = await this.getLolApi();

    const leagues = (await lolApi.League.bySummoner(summonerId, this.config.region)).response;

    const league = leagues.find((l) => l.queueType === this.config.soloQueueType) || null;
    console.log('getSoloQueueLeagueBySummonerId response:', league);
    return league;
  }
}
