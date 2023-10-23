import { capitalized } from '../../../../util/augmentation/string-augmentation';
import {
  MatchSummoner, Player, Summoner,
} from '../../../shared/data/entity';
import { Division } from '../../../shared/types/enum/Division';
import { Tier } from '../../../shared/types/enum/Tier';
import { Player as LeaderboardSummonerApiModel } from '../api/models';

export const transformPlayersToSummonerApiModels = (players: Player[]):
LeaderboardSummonerApiModel[] => players.flatMap(transformPlayerToSummonerApiModels)
  .sort(sortPlayersByRank)
  .map((summoner, i) => ({ ...summoner, place: i + 1 }));

export function transformPlayerToSummonerApiModels(player: Player):
LeaderboardSummonerApiModel[] {
  const { summoners } = player;
  return summoners
    .map(transformSummonerToApiModel)
    .filter((model) => model !== null) as LeaderboardSummonerApiModel[];
}

function transformSummonerToApiModel(summoner: Summoner): Omit<LeaderboardSummonerApiModel, 'place'> | null {
  const {
    id, name, statistics, matches,
  } = summoner;

  if (!statistics) return null;

  const {
    wins, losses, tier, division, leaguePoints,
  } = statistics;

  const winRate = wins / (wins + losses);

  const currentStreak = getCurrentStreak(matches);

  return {
    id,
    name,
    gamesPlayed: wins + losses,
    wins,
    losses,
    winRate,
    tier,
    division,
    leaguePoints,
    currentStreak,
    rank: transformRankToString(tier, division, leaguePoints),
    rankValue: getRankValue(tier, division, leaguePoints),
  };
}

function transformRankToString(tier: Tier, division: Division, leaguePoints: number) {
  if (!tier || !division) return '';
  return `${capitalized(tier.toLowerCase())} ${division}, ${leaguePoints}LP`;
}

function getCurrentStreak(matches: MatchSummoner[]): number {
  if (!matches || matches.length === 0) {
    return 0;
  }

  const matchesByMostRecent = [...matches]
    .sort((a, b) => b.gameEndTimestamp.getTime() - a.gameEndTimestamp.getTime());

  const wasMostRecentMatchWon = matchesByMostRecent[0].win;

  let streak = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const match of matchesByMostRecent) {
    if (wasMostRecentMatchWon) {
      if (match.win) {
        streak++;
      } else {
        break;
      }
    } else if (!match.win) {
      streak--;
    } else {
      break;
    }
  }

  return streak;
}

function sortPlayersByRank(a: LeaderboardSummonerApiModel, b: LeaderboardSummonerApiModel): number {
  return b.rankValue - a.rankValue;
}

function getRankValue(tier: Tier, division: Division, leaguePoints: number) {
  if (!tier || !division) return 0;

  const VALUE_BY_TIER = {
    [Tier.CHALLENGER]: 4500,
    [Tier.GRANDMASTER]: 4000,
    [Tier.MASTER]: 3500,
    [Tier.DIAMOND]: 3000,
    [Tier.EMERALD]: 2500,
    [Tier.PLATINUM]: 2000,
    [Tier.GOLD]: 1500,
    [Tier.SILVER]: 1000,
    [Tier.BRONZE]: 500,
    [Tier.IRON]: 0,
  } as const satisfies Record<Tier, number>;

  const VALUE_BY_DIVISION = {
    [Division.I]: 300,
    [Division.II]: 200,
    [Division.III]: 100,
    [Division.IV]: 0,
  } as const satisfies Record<Division, number>;

  return VALUE_BY_TIER[tier] + VALUE_BY_DIVISION[division] + leaguePoints;
}
