import {
  Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique,
} from 'typeorm';
import { Division } from '../../types/enum/Division';
import { Tier } from '../../types/enum/Tier';
// eslint-disable-next-line import/no-cycle
import { Summoner } from './Summoner';

@Entity()
@Unique('UQ_SUMMONER_DATE', ['summonerId', 'snapshotDate'])
export class RankSnapshot {
  @PrimaryGeneratedColumn('uuid')
    id: string;

  @Column({ type: 'varchar' })
    summonerId: string;

  @Column({ type: 'integer' })
    seasonId: number;

  @Column({ type: 'enum', enum: Tier })
    tier: Tier;

  @Column({ type: 'enum', enum: Division })
    division: Division;

  @Column({ type: 'integer' })
    leaguePoints: number;

  @Column({ type: 'timestamp' })
    snapshotDate: Date;

  @ManyToOne(() => Summoner, (summoner) => summoner.rankSnapshots)
  @JoinColumn({ name: 'summonerId' })
    summoner: Summoner;
}
