import {
  Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn, UpdateDateColumn,
} from 'typeorm';
// eslint-disable-next-line import/no-cycle
import { Player } from './Player';
// eslint-disable-next-line import/no-cycle
import { SummonerStat } from './SummonerStat';
// eslint-disable-next-line import/no-cycle
import { RankSnapshot } from './RankSnapshot';
// eslint-disable-next-line import/no-cycle
import { MatchSummoner } from './MatchSummoner';

@Entity()
export class Summoner {
  @PrimaryColumn({ type: 'varchar' })
    id: string;

  @Column({ type: 'varchar' })
    playerId: string;

  @Column({ type: 'varchar' })
    puuid: string;

  @Column({ type: 'varchar' })
    accountId: string;

  @Column({ type: 'varchar' })
    name: string;

  @Column({ type: 'varchar', default: '' })
    riotIdName: string;

  @Column({ type: 'varchar', default: '' })
    riotIdTagline: string;

  @Column({ type: 'integer' })
    profileIconId: number;

  @Column({ type: 'integer' })
    summonerLevel: number;

  @Column({ type: 'boolean', default: true })
    shouldDisplay: boolean;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

  @ManyToOne(() => Player, (player) => player.summoners)
  @JoinColumn({ name: 'playerId' })
    player: Player;

  @OneToMany(() => MatchSummoner, (match) => match.summoner, { cascade: true })
    matches: MatchSummoner[];

  @OneToOne(() => SummonerStat, (stats) => stats.summoner)
    statistics: SummonerStat;

  @OneToMany(() => RankSnapshot, (snapshot) => snapshot.summoner, { cascade: true })
    rankSnapshots: RankSnapshot[];
}
