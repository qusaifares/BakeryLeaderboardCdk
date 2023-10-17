import {
  Column, Entity, ManyToOne, PrimaryColumn,
} from 'typeorm';
import { PlayerRole } from '../../types/enum/PlayerRole';
import { TeamId } from '../../types/enum/TeamId';
// eslint-disable-next-line import/no-cycle
import { Match } from './Match';

@Entity()
export class MatchSummoner {
  @PrimaryColumn()
    matchId: string;

  @PrimaryColumn()
    summonerId: string;

  @Column({ type: 'enum', enum: PlayerRole, nullable: true })
    position?: PlayerRole;

  @Column({ type: 'enum', enum: TeamId })
    teamId: TeamId;

  @Column()
    championId: number;

  @Column()
    win: boolean;

  // Basic Stats
  @Column()
    kills: number;

  @Column()
    deaths: number;

  @Column()
    assists: number;

  @Column()
    totalMinionsKilled: number;

  // Combat Stats
  @Column()
    damageToChampions: number;

  @Column()
    damageTaken: number;

  @Column()
    healingDone: number;

  // Team Stats
  @Column()
    teamKills: number;

  @Column()
    teamDeaths: number;

  @Column()
    teamGoldEarned: number;

  @Column()
    teamDamageDealtToChampions: number;

  // Economy Stats
  @Column()
    goldEarned: number;

  @Column()
    goldSpent: number;

  // Miscellaneous Stats
  @Column()
    visionScore: number;

  @Column()
    gameDuration: number;

  @Column({ array: true, default: [] })
    allyChampionIds: number[];

  @Column({ array: true, default: [] })
    enemyChampionIds: number[];

  @Column()
    gameCreationTime: number;

  @ManyToOne(() => Match, (match) => match.summoners)
    match: Match;
}
