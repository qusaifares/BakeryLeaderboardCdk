import { MatchV5DTOs } from 'twisted/dist/models-dto';
import {
  Column, Entity, OneToMany, PrimaryColumn,
} from 'typeorm';

// eslint-disable-next-line import/no-cycle
import { MatchSummoner } from './MatchSummoner';

@Entity()
export class Match {
  @PrimaryColumn()
    id: string;

  @Column({ type: 'jsonb', nullable: true })
    matchData: MatchV5DTOs.MatchDto;

  @Column()
    gameCreationTime: number;

  @Column()
    gameDuration: number;

  @OneToMany(() => MatchSummoner, (summoner) => summoner.match)
    summoners: MatchSummoner[];
}
