import {
  Column, Entity, JoinColumn, ManyToOne, PrimaryColumn,
} from 'typeorm';
import { Position } from '../../types/enum/Position';
import { TeamId } from '../../types/enum/TeamId';
// eslint-disable-next-line import/no-cycle
import { Match } from './Match';
// eslint-disable-next-line import/no-cycle
import { Summoner } from './Summoner';

@Entity()
export class MatchSummoner {
  @PrimaryColumn({ type: 'varchar' })
    matchId: string;

  @PrimaryColumn({ type: 'varchar' })
    summonerId: string;

  @Column({ type: 'enum', enum: Position })
    position: Position;

  @Column({ type: 'enum', enum: TeamId })
    teamId: TeamId;

  @Column({ type: 'integer' })
    championId: number;

  @Column({ type: 'boolean' })
    win: boolean;

  // Basic Stats
  @Column({ type: 'integer' })
    kills: number;

  @Column({ type: 'integer' })
    deaths: number;

  @Column({ type: 'integer' })
    assists: number;

  @Column({ type: 'integer' })
    totalMinionsKilled: number;

  // Combat Stats
  @Column({ type: 'integer' })
    damageToChampions: number;

  @Column({ type: 'integer' })
    damageTaken: number;

  @Column({ type: 'integer' })
    healingDone: number;

  // Team Stats
  @Column({ type: 'integer' })
    teamKills: number;

  @Column({ type: 'integer' })
    teamDeaths: number;

  @Column({ type: 'integer' })
    teamGoldEarned: number;

  @Column({ type: 'integer' })
    teamDamageDealtToChampions: number;

  // Economy Stats
  @Column({ type: 'integer' })
    goldEarned: number;

  @Column({ type: 'integer' })
    goldSpent: number;

  // Miscellaneous Stats
  @Column({ type: 'integer' })
    visionScore: number;

  @Column({ type: 'integer' })
    gameDuration: number;

  @Column({ type: 'integer', array: true, default: '{}' })
    allyChampionIds: number[];

  @Column({ type: 'integer', array: true, default: '{}' })
    enemyChampionIds: number[];

  @Column({ type: 'timestamp' })
    gameEndTimestamp: Date;

  // Random
  @Column({ type: 'integer' })
    missingPings: number;

  @ManyToOne(() => Match, (match) => match.summoners)
  @JoinColumn({ name: 'matchId' })
    match: Match;

  @ManyToOne(() => Summoner, (summoner) => summoner.matches)
  @JoinColumn({ name: 'summonerId' })
    summoner: Summoner;
}
