// Spotify API 응답 → Wrapped 카드 데이터 변환 (순수 함수)
// 장르는 Spotify가 deprecated 처리해서 Last.fm으로 따로 가져옴 — src/lib/api/lastfm.ts
import { GENRE_PALETTE, ARTIST_PALETTE } from './tones';
import type {
  WrappedArtist,
  WrappedTrack,
  WrappedGenre,
  WrappedLoyalty,
  WrappedAlbum,
  WrappedTasteShift,
} from './types';

interface SpotifyImage {
  url: string;
  width: number;
  height: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: SpotifyImage[];
}

// 카드 5·6에서 album.id / artist.id가 필요해 기존 타입을 확장
interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    artists?: { id: string; name: string }[];
    images: SpotifyImage[];
  };
}

// 이름에서 이니셜 2글자 추출 (영문 우선, 한글이면 첫 글자만)
function makeInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '••';
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

// 이미지 배열에서 적당한 사이즈 (없으면 첫번째)
function pickImage(images: SpotifyImage[]): string | null {
  if (!images || images.length === 0) return null;
  // 작은 사이즈 선호 (Wrapped 카드는 64px 이내) — 마지막이 가장 작음
  return images[images.length - 1].url;
}

// Spotify Top Artists → WrappedArtist[]
export function toWrappedArtists(items: SpotifyArtist[], limit = 5): WrappedArtist[] {
  return items.slice(0, limit).map((a, i) => ({
    rank: i + 1,
    name: a.name,
    imageUrl: pickImage(a.images),
    color: ARTIST_PALETTE[i % ARTIST_PALETTE.length],
    initials: makeInitials(a.name),
    genres: a.genres ?? [],
  }));
}

// Spotify Top Tracks → WrappedTrack[]
export function toWrappedTracks(items: SpotifyTrack[], limit = 5): WrappedTrack[] {
  return items.slice(0, limit).map((t, i) => ({
    rank: i + 1,
    name: t.name,
    artist: t.artists.map((a) => a.name).join(', '),
    imageUrl: pickImage(t.album.images),
    color: ARTIST_PALETTE[i % ARTIST_PALETTE.length],
  }));
}

interface GenreDistributionItem {
  name: string;
  count: number;
  percentage: number;
}

// Last.fm 장르 분포 → WrappedGenre[] (도넛 차트용)
// 상위 topN개만 추려서 그 안에서의 비율로 재계산 (전체 분포 대비가 아닌 Top N 안에서의 비율이라 도넛이 100% 채워짐)
export function toWrappedGenres(
  distribution: GenreDistributionItem[],
  topN = 5
): WrappedGenre[] {
  if (distribution.length === 0) return [];

  const top = distribution.slice(0, topN);
  const totalCount = top.reduce((s, d) => s + d.count, 0);
  if (totalCount === 0) return [];

  const result: WrappedGenre[] = top.map((d, i) => ({
    name: d.name,
    pct: Math.round((d.count / totalCount) * 100),
    color: GENRE_PALETTE[i % GENRE_PALETTE.length],
  }));

  // 반올림 오차는 마지막 항목에 흡수해서 합계 정확히 100으로 맞춤 (conic-gradient 빈틈 방지)
  const sumPct = result.reduce((s, g) => s + g.pct, 0);
  if (sumPct !== 100) {
    result[result.length - 1].pct += 100 - sumPct;
  }

  return result;
}

// 카드 5 — Loyalty
// Top 50 트랙의 1순위 아티스트(primary artist)를 카운트해서 최다 아티스트 추출.
// 아티스트의 이미지/색은 top_artists(20명)에서 찾고, 거기에도 없으면 placeholder 팔레트.
export function aggregateLoyalty(
  tracks: SpotifyTrack[],
  artists: SpotifyArtist[]
): WrappedLoyalty | null {
  if (tracks.length === 0) return null;

  const counts = new Map<string, { name: string; count: number }>();
  tracks.forEach((t) => {
    const primary = t.artists[0];
    if (!primary) return;
    const prev = counts.get(primary.id);
    if (prev) prev.count += 1;
    else counts.set(primary.id, { name: primary.name, count: 1 });
  });

  if (counts.size === 0) return null;

  // 최다 등장 아티스트
  const [topId, top] = [...counts.entries()].sort((a, b) => b[1].count - a[1].count)[0];

  // 이미지/장르를 top_artists에서 찾아 재활용 (있으면)
  const matched = artists.find((a) => a.id === topId);

  return {
    artist_name: top.name,
    artist_color: ARTIST_PALETTE[0], // 항상 1순위 색 (디자인 일관성)
    artist_initials: makeInitials(top.name),
    artist_image_url: matched ? pickImage(matched.images) : null,
    count: top.count,
  };
}

// 카드 6 — Top Album
// Top 50 트랙을 album.id별로 카운트해서 최다 앨범 추출.
function buildAlbumColor(albumId: string): string {
  // 앨범 ID 해시로 팔레트 색을 결정 (같은 앨범이면 항상 같은 색)
  let hash = 0;
  for (let i = 0; i < albumId.length; i++) {
    hash = (hash * 31 + albumId.charCodeAt(i)) & 0xffffffff;
  }
  return GENRE_PALETTE[Math.abs(hash) % GENRE_PALETTE.length];
}

export function aggregateTopAlbum(tracks: SpotifyTrack[]): WrappedAlbum | null {
  if (tracks.length === 0) return null;

  const counts = new Map<
    string,
    { name: string; artist: string; images: SpotifyImage[]; count: number }
  >();

  tracks.forEach((t) => {
    if (!t.album?.id) return;
    const prev = counts.get(t.album.id);
    if (prev) {
      prev.count += 1;
    } else {
      counts.set(t.album.id, {
        name: t.album.name,
        // album.artists가 없는 응답 케이스 대비 → 트랙의 primary 아티스트로 폴백
        artist: t.album.artists?.[0]?.name ?? t.artists[0]?.name ?? '',
        images: t.album.images,
        count: 1,
      });
    }
  });

  if (counts.size === 0) return null;

  const [topId, top] = [...counts.entries()].sort((a, b) => b[1].count - a[1].count)[0];

  return {
    name: top.name,
    artist: top.artist,
    color: buildAlbumColor(topId),
    image_url: pickAlbumImage(top.images),
    count: top.count,
  };
}

// 앨범 커버는 큰 사이즈가 좋음 (260×260 표시) — 가장 큰 이미지 선택
function pickAlbumImage(images: SpotifyImage[]): string | null {
  if (!images || images.length === 0) return null;
  return images[0].url;
}

// 카드 7 — Taste Shift
// newLove: short_term[0~] 중 long_term 상위 10에 없는 첫 번째 (없으면 short_term[0])
// constant: long_term[0~] 중 short_term 상위 10에 있는 첫 번째 (없으면 long_term[0])
export function aggregateTasteShift(
  shortTermArtists: SpotifyArtist[],
  longTermArtists: SpotifyArtist[]
): WrappedTasteShift | null {
  if (shortTermArtists.length === 0 || longTermArtists.length === 0) return null;

  const longTopIds = new Set(longTermArtists.slice(0, 10).map((a) => a.id));
  const shortTopIds = new Set(shortTermArtists.slice(0, 10).map((a) => a.id));

  // newLove: short에는 있는데 long 상위 10에는 없는 첫 아티스트
  const newLoveArtist =
    shortTermArtists.find((a) => !longTopIds.has(a.id)) ?? shortTermArtists[0];

  // constant: long에 있는데 short 상위 10에도 있는 첫 아티스트 — 둘 다에서 사랑받는 사람
  // newLove와 같은 인물이면 안 되므로 (희박하지만) 제외
  const constantArtist =
    longTermArtists.find((a) => shortTopIds.has(a.id) && a.id !== newLoveArtist.id) ??
    longTermArtists.find((a) => a.id !== newLoveArtist.id) ??
    longTermArtists[0];

  return {
    new_love: {
      name: newLoveArtist.name,
      initials: makeInitials(newLoveArtist.name),
      color: ARTIST_PALETTE[3 % ARTIST_PALETTE.length], // 따뜻한 톤 (4번 인덱스)
      image_url: pickImage(newLoveArtist.images),
    },
    constant: {
      name: constantArtist.name,
      initials: makeInitials(constantArtist.name),
      color: ARTIST_PALETTE[1 % ARTIST_PALETTE.length],
      image_url: pickImage(constantArtist.images),
    },
  };
}
