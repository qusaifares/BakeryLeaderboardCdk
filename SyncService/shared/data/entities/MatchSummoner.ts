import { Column, Entity, PrimaryColumn } from 'typeorm';
import { PlayerRole } from '../../types/enum/PlayerRole';
import { TeamId } from '../../types/enum/TeamId';

@Entity()
export class MatchSummoner {
  @PrimaryColumn()
    matchId: string;

  @PrimaryColumn()
    summonerId: string;

  @Column({ type: 'enum', enum: PlayerRole })
    position: PlayerRole;

  @Column({ type: 'enum', enum: TeamId })
    team: TeamId;

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

  // Efficiency Stats
  @Column()
    killParticipation: number;

  // Economy Stats
  @Column()
    goldEarned: number;

  @Column()
    goldSpent: number;

  // Miscellaneous Stats
  @Column()
    visionScore: number;

  @Column()
    gameTime: number;

  @Column({ type: 'timestamp' })
    gameCreationTimestamp: Date;
}
