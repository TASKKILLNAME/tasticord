// POST /api/wrapped/generate
// 본인의 Spotify Top Artists/Tracks를 가져와 wrapped_reports에 upsert
// 인증 필수 (본인만 본인 카드 생성 가능)
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidSpotifyToken } from '@/lib/api/spotify-token';
import { getTopArtists, getTopTracks } from '@/lib/api/spotify';
import { getArtistsGenreDistribution } from '@/lib/api/lastfm';
import {
  toWrappedArtists,
  toWrappedTracks,
  toWrappedGenres,
  aggregateLoyalty,
  aggregateTopAlbum,
  aggregateTasteShift,
} from '@/lib/wrapped/aggregate';
import { DEFAULT_TONE } from '@/lib/wrapped/tones';
import { DEFAULT_TIME_RANGE, type TimeRange } from '@/lib/wrapped/types';

const VALID_TIME_RANGES: TimeRange[] = ['short_term', 'medium_term', 'long_term'];

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 바디에서 time_range 파라미터 (없으면 디폴트)
    let timeRange: TimeRange = DEFAULT_TIME_RANGE;
    try {
      const body = await req.json();
      if (body?.time_range && VALID_TIME_RANGES.includes(body.time_range)) {
        timeRange = body.time_range;
      }
    } catch {
      // 바디 비어있으면 디폴트 사용
    }

    // Spotify 토큰 확보 (만료 시 자동 갱신)
    const tokenInfo = await getValidSpotifyToken();
    if (!tokenInfo) {
      return NextResponse.json(
        { error: 'Spotify가 연동되어 있지 않거나 토큰이 만료됐어요. 다시 연결해주세요.' },
        { status: 400 }
      );
    }

    // 카드별 데이터 출처:
    //  - 1·2·3 : artistsRes(20) + tracksRes(5는 표시용, 50은 집계용으로 재사용) + Last.fm
    //  - 5 (Loyalty)     : tracksRes(50) + artistsRes(이미지 매칭용)
    //  - 6 (Top Album)   : tracksRes(50)
    //  - 7 (Taste Shift) : short_term + long_term Top Artists
    //
    // tracksRes는 50개로 늘려서 집계용으로 쓰되, 카드 2 표시는 toWrappedTracks(.. , 5)로 상위 5개만.
    // Taste Shift용 short/long 호출은 사용자 선택 기간과 중복되면 같은 응답을 재사용.

    const needsShort = timeRange !== 'short_term';
    const needsLong = timeRange !== 'long_term';

    const [artistsRes, tracksRes, shortArtistsRes, longArtistsRes] = await Promise.all([
      getTopArtists(tokenInfo.accessToken, timeRange, 20),
      getTopTracks(tokenInfo.accessToken, timeRange, 50),
      needsShort
        ? getTopArtists(tokenInfo.accessToken, 'short_term', 20)
        : Promise.resolve(null),
      needsLong
        ? getTopArtists(tokenInfo.accessToken, 'long_term', 20)
        : Promise.resolve(null),
    ]);

    // short/long 한쪽이 선택 기간과 같으면 artistsRes로 폴백
    const shortArtists = (shortArtistsRes ?? artistsRes).items ?? [];
    const longArtists = (longArtistsRes ?? artistsRes).items ?? [];

    const topArtists = toWrappedArtists(artistsRes.items ?? [], 5);
    const topTracks = toWrappedTracks(tracksRes.items ?? [], 5);

    if (topArtists.length === 0 && topTracks.length === 0) {
      return NextResponse.json(
        { error: 'Spotify에서 가져올 데이터가 없어요. 좀 더 들으신 후에 다시 시도해주세요.' },
        { status: 400 }
      );
    }

    // 카드 5·6·7 집계 (DB가 null 허용이라 실패해도 카드 자체는 저장됨)
    const topLoyalty = aggregateLoyalty(tracksRes.items ?? [], artistsRes.items ?? []);
    const topAlbum = aggregateTopAlbum(tracksRes.items ?? []);
    const tasteShift = aggregateTasteShift(shortArtists, longArtists);

    // 장르는 Spotify가 deprecated 처리해서 Last.fm 태그로 집계 (3-5초 소요)
    // 아티스트 20명 전체 이름으로 더 풍부하게 (Wrapped 카드 상위 5개만 갖고는 표본이 부족)
    let topGenres: ReturnType<typeof toWrappedGenres> = [];
    if (process.env.LASTFM_API_KEY) {
      const artistNames = (artistsRes.items ?? []).map((a: { name: string }) => a.name);
      try {
        const distribution = await getArtistsGenreDistribution(artistNames);
        topGenres = toWrappedGenres(distribution.genres, 5);
      } catch (err) {
        console.error('[wrapped/generate] Last.fm 장르 집계 실패', err);
      }
    } else {
      console.warn('[wrapped/generate] LASTFM_API_KEY 미설정 — 장르 카드는 빈 상태로 저장');
    }

    // 푸터 캐시용 프로필 정보
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname, avatar_url')
      .eq('id', user.id)
      .single();

    // upsert (재생성 시 기존 행 덮어씀)
    const { data, error } = await supabase
      .from('wrapped_reports')
      .upsert({
        user_id: user.id,
        tone: DEFAULT_TONE,
        time_range: timeRange,
        top_artists: topArtists,
        top_tracks: topTracks,
        top_genres: topGenres,
        top_loyalty: topLoyalty,
        top_album: topAlbum,
        taste_shift: tasteShift,
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[wrapped/generate] DB upsert failed', error);
      return NextResponse.json({ error: 'DB 저장 실패' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[wrapped/generate]', err);
    return NextResponse.json({ error: '생성 실패' }, { status: 500 });
  }
}
