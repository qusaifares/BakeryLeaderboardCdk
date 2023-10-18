import 'reflect-metadata';
import {
  Column, Entity, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm';
// eslint-disable-next-line import/no-cycle
import { Summoner } from './Summoner';

@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
    id: string;

  @Column({ type: 'varchar', unique: true })
    discordId: string;

  @Column({ type: 'varchar' })
    name: string;

  @Column({ type: 'varchar', array: true, default: '{}' })
    keyWords: string[];

  @OneToMany(() => Summoner, (summoner) => summoner.player, { cascade: true })
    summoners: Summoner[];
}
