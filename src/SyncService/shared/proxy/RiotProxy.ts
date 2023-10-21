import { LolApi } from 'twisted/dist/apis/lol/lol';
import { RiotConfig } from '../config/RiotConfig';
import { TimeMeasurement } from '../utils/TimeMeasurement';

export class RiotProxy {
  private static MATCH_LIMIT: number = 100;

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

  async getAllMatchIdsSince(puuid: string, startEpochMilli: number) {
    const matchIds: string[] = [];
    const interval = TimeMeasurement.ofMilliSeconds(Date.now() - startEpochMilli);

    let start = 0;

    try {
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const matchIdsRes = await this.getMatchIdsByPuuid(puuid, interval, start);

        matchIds.push(...matchIdsRes);
        if (matchIdsRes.length < RiotProxy.MATCH_LIMIT) {
          break;
        }
        start += RiotProxy.MATCH_LIMIT;
      }
    } catch (error) {
      console.error(error);
    }
    console.log(`getAllMatchIdsSince responded with ${matchIds.length} match IDs`);
    return matchIds;
  }

  async getMatchIdsByPuuid(puuid: string, interval: TimeMeasurement, start = 0) {
    const currentEpochSeconds = Math.floor(Date.now() / 1000);
    const startTime = currentEpochSeconds - Math.floor(interval.toSeconds());

    const lolApi = await this.getLolApi();

    const { response } = await lolApi.MatchV5
      .list(
        puuid,
        this.config.regionGroup,
        {
          queue: this.config.soloQueueId,
          startTime,
          count: 100,
          start,
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
