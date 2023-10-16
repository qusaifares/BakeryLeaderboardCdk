import {
  Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn,
} from 'typeorm';
// eslint-disable-next-line import/no-cycle
import { Player } from './Player';

@Entity()
export class Summoner {
  @PrimaryColumn()
    summonerId: string;

  @Column()
    playerId: string;

  @Column()
    puuid: string;

  @Column()
    accountId: string;

  @Column()
    name: string;

  @Column()
    profileIconId: number;

  @Column()
    summonerLevel: number;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

  @ManyToOne(() => Player, (player) => player.summoners)
  @JoinColumn({ name: 'playerId' })
    player: Player;
}
