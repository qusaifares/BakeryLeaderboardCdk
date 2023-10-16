import { MatchDto } from 'twisted/dist/models-dto';
import {
  Column, Entity, PrimaryColumn,
} from 'typeorm';

@Entity()
export class Match {
  @PrimaryColumn()
    id: string;

  @Column({ type: 'jsonb', nullable: true })
    matchData: MatchDto;

  @Column({ type: 'timestamp' })
    gameCreationTimestamp: Date;
}
