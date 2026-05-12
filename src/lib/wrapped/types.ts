// Wrapped 카드 데이터 타입
// DB(wrapped_reports) JSONB 컬럼과 1:1 대응

export interface WrappedArtist {
  rank: number;
  name: string;
  imageUrl: string | null;
  color: string;
  initials: string;
  genres: string[];
}

export interface WrappedTrack {
  rank: number;
  name: string;
  artist: string;
  imageUrl: string | null;
  color: string;
}

export interface WrappedGenre {
  name: string;
  pct: number;
  color: string;
}

// 카드 5 — Loyalty (Top 50곡 중 N곡이 한 아티스트)
export interface WrappedLoyalty {
  artist_name: string;
  artist_color: string;
  artist_initials: string;
  artist_image_url: string | null;
  count: number; // Top 50 중 이 아티스트의 곡 수
}

// 카드 6 — Top Album (Top 50곡에서 가장 많이 등장한 앨범)
export interface WrappedAlbum {
  name: string;
  artist: string;
  color: string;
  image_url: string | null;
  count: number; // Top 50 중 이 앨범 수록 곡 수
}

// 카드 7 — Taste Shift (최근 4주 vs 평생)
interface TasteShiftArtist {
  name: string;
  initials: string;
  color: string;
  image_url: string | null;
}

export interface WrappedTasteShift {
  new_love: TasteShiftArtist;   // 최근 4주에 새로 빠진 아티스트
  constant: TasteShiftArtist;   // 변함없이 좋아하는 아티스트
}

// Spotify Web API의 time_range 값과 동일
// short_term: 최근 약 4주
// medium_term: 최근 약 6개월
// long_term: 전체 기간 (Spotify 데이터 누적 전체)
export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

export const TIME_RANGE_LABELS: Record<TimeRange, { ko: string; en: string }> = {
  short_term: { ko: '최근 1개월', en: 'PAST MONTH' },
  medium_term: { ko: '최근 6개월', en: 'PAST 6 MONTHS' },
  long_term: { ko: '전체 기간', en: 'ALL TIME' },
};

export const DEFAULT_TIME_RANGE: TimeRange = 'medium_term';

export interface WrappedReport {
  user_id: string;
  tone: 'A' | 'B' | 'C';
  time_range: TimeRange;
  top_artists: WrappedArtist[];
  top_tracks: WrappedTrack[];
  top_genres: WrappedGenre[];
  // 카드 5·6·7 — 마이그 전에 생성된 행에는 null이라 옵셔널 처리
  top_loyalty: WrappedLoyalty | null;
  top_album: WrappedAlbum | null;
  taste_shift: WrappedTasteShift | null;
  nickname: string | null;
  avatar_url: string | null;
  generated_at: string;
}
