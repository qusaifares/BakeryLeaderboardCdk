import {
  Column, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn,
} from 'typeorm';
import { Tier } from '../../types/enum/Tier';
import { Division } from '../../types/enum/Division';
// eslint-disable-next-line import/no-cycle
import { Summoner } from './Summoner';

@Entity()
export class SummonerStat {
  @PrimaryColumn({ type: 'varchar' })
    summonerId: string;

  // Basic Stats
  @Column({ type: 'integer', default: 0 })
    wins: number;

  @Column({ type: 'integer', default: 0 })
    losses: number;

  @Column({ type: 'integer', default: 0 })
    kills: number;

  @Column({ type: 'integer', default: 0 })
    deaths: number;

  @Column({ type: 'integer', default: 0 })
    assists: number;

  @Column({ type: 'integer', default: 0 })
    totalMinionsKilled: number;

  // Combat Stats
  @Column({ type: 'integer', default: 0 })
    damageToChampions: number;

  @Column({ type: 'integer', default: 0 })
    damageTaken: number;

  @Column({ type: 'integer', default: 0 })
    healingDone: number;

  // Team Stats
  @Column({ type: 'integer', default: 0 })
    teamKills: number;

  @Column({ type: 'integer', default: 0 })
    teamDeaths: number;

  @Column({ type: 'integer', default: 0 })
    teamGoldEarned: number;

  @Column({ type: 'integer', default: 0 })
    teamDamageDealtToChampions: number;

  // Economy Stats
  @Column({ type: 'integer', default: 0 })
    goldEarned: number;

  @Column({ type: 'integer', default: 0 })
    goldSpent: number;

  // Miscellaneous Stats
  @Column({ type: 'integer', default: 0 })
    totalVisionScore: number;

  @Column({ type: 'integer', default: 0 })
    totalGameTime: number;

  // Current Rank
  @Column({ type: 'varchar', nullable: true })
    leagueId: string;

  @Column({ type: 'enum', enum: Tier, nullable: true })
    tier: Tier;

  @Column({ type: 'enum', enum: Division, nullable: true })
    division: Division;

  @Column({ type: 'integer', nullable: true })
    leaguePoints: number;

  // Random
  @Column({ type: 'integer', default: 0 })
    missingPings: number;

  @Column({ type: 'varchar', array: true, default: '{}' })
    matchIdsTracked: string[];

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    rankLastUpdated: Date;

  @OneToOne(() => Summoner, (summoner) => summoner.statistics)
  @JoinColumn()
    summoner: Summoner;

  static copyOf(stat: SummonerStat) {
    const newStat = new SummonerStat();
    Object.entries(stat).forEach(([k, v]) => {
      // @ts-ignore
      newStat[k] = v;
    });
    return newStat;
  }

  static getDefault(summonerId: string) {
    const stats = new SummonerStat();
    stats.summonerId = summonerId;
    stats.wins = 0;
    stats.losses = 0;
    stats.kills = 0;
    stats.deaths = 0;
    stats.assists = 0;
    stats.totalMinionsKilled = 0;
    stats.damageToChampions = 0;
    stats.damageTaken = 0;
    stats.healingDone = 0;
    stats.teamKills = 0;
    stats.teamDeaths = 0;
    stats.teamGoldEarned = 0;
    stats.teamDamageDealtToChampions = 0;
    stats.goldEarned = 0;
    stats.goldSpent = 0;
    stats.totalVisionScore = 0;
    stats.totalGameTime = 0;
    stats.missingPings = 0;
    stats.matchIdsTracked = [];

    return stats;
  }
}
