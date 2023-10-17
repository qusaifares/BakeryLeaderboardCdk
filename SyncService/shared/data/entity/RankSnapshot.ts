import {
  Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique,
} from 'typeorm';
import { Division } from '../../types/enum/Division';
import { Tier } from '../../types/enum/Tier';
// eslint-disable-next-line import/no-cycle
import { Summoner } from './Summoner';

@Entity()
@Unique('UQ_SUMMONER_DATE', ['summonerId', 'snapshotDate'])
export class RankSnapshot {
  @PrimaryGeneratedColumn()
    id: string;

  @Column()
    summonerId: string;

  @Column()
    seasonId: number;

  @Column({ type: 'enum', enum: Tier })
    tier: Tier;

  @Column({ type: 'enum', enum: Division })
    division: Division;

  @Column()
    leaguePoints: number;

  @Column()
    snapshotDate: Date;

  @ManyToOne(() => Summoner, (summoner) => summoner.rankSnapshots)
    summoner: Summoner;
}
