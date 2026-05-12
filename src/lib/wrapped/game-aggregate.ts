// Steam 응답 → Wrapped Games 카드 데이터 변환 (순수 함수)
// 네트워크 호출 없음. generate route에서 응답을 모아 호출.
import { GENRE_PALETTE } from './tones';
import type {
  RecentTopGame,
  AllTimeTopGame,
  WrappedRecentObsession,
  WrappedGameGenre,
  WrappedTotalHours,
  WrappedLibraryStats,
} from './game-types';

// Steam 게임 객체 (Steam API 응답 + 우리 캐시 형태 모두 수용)
export interface SteamGame {
  appid: number;
  name: string;
  playtime_minutes: number; // 분
  // playtime_forever와 playtime_2weeks를 호출자가 골라 minutes에 넣어서 전달
  icon?: string;
}

interface SteamGenreStat {
  name: string;
  playtime: number; // 분
  count: number;
}

// Steam Store CDN 헤더 이미지 — 모든 게임 앱이 보장하는 표준 경로
// (shared.cloudflare.steamstatic.com은 커뮤니티용이라 store header 미서빙)
function gameImageUrl(appid: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

// 분 → 시간 (소수 1자리)
function toHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

// 게임/아티스트 이름 → 2글자 이니셜 (이미지 로드 실패 시 폴백용)
export function makeGameInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '••';
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

// 카드 1 — 최근 2주 Top 5
export function toRecentTopGames(recentGames: SteamGame[], limit = 5): RecentTopGame[] {
  return recentGames
    .filter((g) => g.playtime_minutes > 0)
    .sort((a, b) => b.playtime_minutes - a.playtime_minutes)
    .slice(0, limit)
    .map((g, i) => ({
      rank: i + 1,
      appid: g.appid,
      name: g.name,
      image_url: gameImageUrl(g.appid),
      playtime_hours: toHours(g.playtime_minutes),
    }));
}

// 카드 2 — 최근 2주 Obsession (1위 + 비중)
export function toRecentObsession(recentGames: SteamGame[]): WrappedRecentObsession | null {
  const played = recentGames.filter((g) => g.playtime_minutes > 0);
  if (played.length === 0) return null;

  const sorted = [...played].sort((a, b) => b.playtime_minutes - a.playtime_minutes);
  const top = sorted[0];
  const totalRecent = played.reduce((s, g) => s + g.playtime_minutes, 0);

  return {
    appid: top.appid,
    name: top.name,
    image_url: gameImageUrl(top.appid),
    playtime_hours: toHours(top.playtime_minutes),
    pct_of_recent: totalRecent > 0 ? Math.round((top.playtime_minutes / totalRecent) * 100) : 0,
  };
}

// 카드 3 — 누적 Top 5
export function toAllTimeTopGames(ownedGames: SteamGame[], limit = 5): AllTimeTopGame[] {
  return ownedGames
    .filter((g) => g.playtime_minutes > 0)
    .sort((a, b) => b.playtime_minutes - a.playtime_minutes)
    .slice(0, limit)
    .map((g, i) => ({
      rank: i + 1,
      appid: g.appid,
      name: g.name,
      image_url: gameImageUrl(g.appid),
      playtime_hours: toHours(g.playtime_minutes),
    }));
}

// 카드 4 — 장르 도넛 (Steam Store API의 genreStats 결과를 받아 가공)
export function toGenreMix(genreStats: SteamGenreStat[], topN = 5): WrappedGameGenre[] {
  if (genreStats.length === 0) return [];

  const top = genreStats.slice(0, topN);
  const totalPlaytime = top.reduce((s, g) => s + g.playtime, 0);
  if (totalPlaytime === 0) return [];

  const result: WrappedGameGenre[] = top.map((g, i) => ({
    name: g.name,
    pct: Math.round((g.playtime / totalPlaytime) * 100),
    color: GENRE_PALETTE[i % GENRE_PALETTE.length],
  }));

  // 반올림 오차 → 마지막 항목에 흡수해서 합계 100 (conic-gradient 빈틈 방지)
  const sumPct = result.reduce((s, g) => s + g.pct, 0);
  if (sumPct !== 100) {
    result[result.length - 1].pct += 100 - sumPct;
  }

  return result;
}

// 카드 5 — 누적 시간
export function toTotalHours(ownedGames: SteamGame[]): WrappedTotalHours | null {
  if (ownedGames.length === 0) return null;
  const totalMinutes = ownedGames.reduce((s, g) => s + g.playtime_minutes, 0);
  if (totalMinutes === 0) return null;

  const totalHours = Math.round(totalMinutes / 60);
  const totalDays = Math.round(totalMinutes / 60 / 24);
  return { total_hours: totalHours, total_days: totalDays };
}

// 카드 6 — 라이브러리
export function toLibraryStats(
  ownedGames: SteamGame[],
  totalOwnedCount?: number
): WrappedLibraryStats | null {
  if (ownedGames.length === 0) return null;
  // owned 응답의 game_count가 따로 들어오면 우선 (50개로 잘린 리스트 대비)
  const totalOwned = totalOwnedCount ?? ownedGames.length;
  const totalPlayed = ownedGames.filter((g) => g.playtime_minutes > 0).length;
  const unplayed = Math.max(0, totalOwned - totalPlayed);
  const unplayedPct = totalOwned > 0 ? Math.round((unplayed / totalOwned) * 100) : 0;

  return {
    total_owned: totalOwned,
    total_played: totalPlayed,
    unplayed,
    unplayed_pct: unplayedPct,
  };
}
