import { LolApi } from 'twisted/dist/apis/lol/lol';
import { RiotConfig } from '../config/RiotConfig';
import { TimeMeasurement } from '../utils/TimeMeasurement';

export class RiotProxy {
  private readonly lolApi: LolApi;

  constructor(private readonly config: RiotConfig) {
    this.lolApi = new LolApi({ key: this.config.apiKey });
  }

  async getSummonerByName(summonerName: string) {
    return (await this.lolApi.Summoner.getByName(summonerName, this.config.region)).response;
  }

  async getMatchIdsByPuuid(puuid: string, interval: TimeMeasurement) {
    const currentEpochSeconds = Math.floor(Date.now() / 1000);
    const startTime = currentEpochSeconds - interval.toSeconds();

    return (await this.lolApi.MatchV5
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
    return (await this.lolApi.MatchV5.get(id, this.config.regionGroup)).response;
  }

  async getLeaguesBySummonerId(summonerId: string) {
    return (await this.lolApi.League.bySummoner(summonerId, this.config.region)).response;
  }

  async getSoloQueueLeagueBySummonerId(summonerId: string) {
    const leagues = (await this.lolApi.League.bySummoner(summonerId, this.config.region)).response;

    return leagues.find((league) => league.queueType === `${this.config.soloQueueId}`) || null;
  }
}
