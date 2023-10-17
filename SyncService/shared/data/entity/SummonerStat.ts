import {
  Column, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn,
} from 'typeorm';
import { Tier } from '../../types/enum/Tier';
import { Division } from '../../types/enum/Division';
// eslint-disable-next-line import/no-cycle
import { Summoner } from './Summoner';

@Entity()
export class SummonerStat {
  @PrimaryColumn()
    summonerId: string;

  @OneToOne(() => Summoner, (summoner) => summoner.statistics)
  @JoinColumn()
    summoner: Summoner;

  // Basic Stats
  @Column({ default: 0 })
    wins: number;

  @Column({ default: 0 })
    losses: number;

  @Column({ default: 0 })
    kills: number;

  @Column({ default: 0 })
    deaths: number;

  @Column({ default: 0 })
    assists: number;

  @Column({ default: 0 })
    totalMinionsKilled: number;

  // Combat Stats
  @Column({ default: 0 })
    damageToChampions: number;

  @Column({ default: 0 })
    damageTaken: number;

  @Column({ default: 0 })
    healingDone: number;

  // Team Stats
  @Column({ default: 0 })
    teamKills: number;

  @Column({ default: 0 })
    teamDeaths: number;

  @Column({ default: 0 })
    teamGoldEarned: number;

  @Column({ default: 0 })
    teamDamageDealtToChampions: number;

  // Economy Stats
  @Column({ default: 0 })
    goldEarned: number;

  @Column({ default: 0 })
    goldSpent: number;

  // Miscellaneous Stats
  @Column({ default: 0 })
    totalVisionScore: number;

  @Column({ default: 0 })
    totalGameTime: number;

  // Current Rank
  @Column({ nullable: true })
    leagueId: string;

  @Column({ type: 'enum', enum: Tier, nullable: true })
    tier: Tier;

  @Column({ type: 'enum', enum: Division, nullable: true })
    division: Division;

  @Column({ nullable: true })
    leaguePoints: number;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
