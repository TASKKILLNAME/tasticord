// Wrapped 게임 카드 데이터 타입
// DB(wrapped_games_reports) JSONB 컬럼과 1:1 대응
//
// 흐름: 최근(Front) → 누적(Back)
//  1. RecentTopGame    — 최근 2주 Top 5
//  2. RecentObsession  — 최근 2주 1위
//  3. AllTimeTopGame   — 누적 Top 5
//  4. GenreMix         — 장르 도넛
//  5. TotalHours       — 누적 플레이타임 합계
//  6. LibraryStats     — 보유 게임 + Backlog

export interface WrappedGameItem {
  rank: number;
  appid: number;
  name: string;
  image_url: string;
  playtime_hours: number;
}

interface SingleGame {
  appid: number;
  name: string;
  image_url: string;
  playtime_hours: number;
}

// 카드 1
export type RecentTopGame = WrappedGameItem;

// 카드 2 — 최근 2주의 단일 obsession (누적 대비 비율도 같이 보여줌)
export interface WrappedRecentObsession extends SingleGame {
  pct_of_recent: number; // 최근 2주 플레이타임 중 이 게임의 비율 (0~100)
}

// 카드 3 — 누적 Top
export type AllTimeTopGame = WrappedGameItem;

// 카드 4 — 장르 도넛
export interface WrappedGameGenre {
  name: string;
  pct: number;
  color: string;
}

// 카드 5 — 누적 시간
export interface WrappedTotalHours {
  total_hours: number;
  total_days: number; // 24시간 단위로 환산한 일수
}

// 카드 6 — 라이브러리
export interface WrappedLibraryStats {
  total_owned: number;     // 전체 보유 게임 수
  total_played: number;    // 한 번이라도 플레이한 게임 수
  unplayed: number;        // 한 번도 안 켜본 게임 수
  unplayed_pct: number;    // 안 켜본 비율 (0~100)
}

export interface WrappedGamesReport {
  user_id: string;
  tone: 'A' | 'B' | 'C';
  recent_top_games: RecentTopGame[];
  recent_obsession: WrappedRecentObsession | null;
  all_time_top_games: AllTimeTopGame[];
  genre_mix: WrappedGameGenre[];
  total_hours: WrappedTotalHours | null;
  library_stats: WrappedLibraryStats | null;
  nickname: string | null;
  avatar_url: string | null;
  generated_at: string;
}
