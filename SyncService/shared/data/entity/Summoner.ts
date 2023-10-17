import {
  Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn, UpdateDateColumn,
} from 'typeorm';
// eslint-disable-next-line import/no-cycle
import { Player } from './Player';
// eslint-disable-next-line import/no-cycle
import { SummonerStat } from './SummonerStat';
// eslint-disable-next-line import/no-cycle
import { RankSnapshot } from './RankSnapshot';

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

  @Column({ default: true })
    shouldDisplay: boolean;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

  @ManyToOne(() => Player, (player) => player.summoners)
  @JoinColumn({ name: 'playerId' })
    player: Player;

  @OneToOne(() => SummonerStat, (stats) => stats.summoner)
    statistics: SummonerStat;

  @OneToMany(() => RankSnapshot, (snapshot) => snapshot.summoner)
    rankSnapshots: RankSnapshot[];
}
