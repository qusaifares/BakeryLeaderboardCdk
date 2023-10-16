import { Column, Entity, UpdateDateColumn } from 'typeorm';

@Entity()
export class SummonerStat {
  summonerId: string;

  // Basic Stats
  @Column()
    wins: number;

  @Column()
    losses: number;

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
    totalVisionScore: number;

  @Column()
    totalGameTime: number;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
