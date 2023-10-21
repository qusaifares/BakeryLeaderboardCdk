import { MatchV5DTOs } from 'twisted/dist/models-dto';
import {
  Column, Entity, OneToMany, PrimaryColumn,
} from 'typeorm';

// eslint-disable-next-line import/no-cycle
import { MatchSummoner } from './MatchSummoner';

@Entity()
export class Match {
  @PrimaryColumn({ type: 'varchar' })
    id: string;

  @Column({ type: 'jsonb', nullable: true })
    matchData: MatchV5DTOs.MatchDto;

  @Column({ type: 'timestamp' })
    gameEndTimestamp: Date;

  @Column({ type: 'integer' })
    gameDuration: number;

  @OneToMany(() => MatchSummoner, (summoner) => summoner.match, { cascade: true })
    summoners: MatchSummoner[];
}
