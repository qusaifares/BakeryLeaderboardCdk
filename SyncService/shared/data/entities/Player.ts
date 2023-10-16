import {
  Column, Entity, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm';
// eslint-disable-next-line import/no-cycle
import { Summoner } from './Summoner';

@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
    id: string;

  @Column()
    discordId: string;

  // @Column()
  //   displayName: string;

  @Column({ array: true })
    keyWords: string[];

  @OneToMany(() => Summoner, (summoner) => summoner.player)
    summoners: Summoner[];
}
