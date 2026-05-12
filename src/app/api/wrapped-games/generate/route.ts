// POST /api/wrapped-games/generate
// 본인의 Steam Owned/Recent + 장르를 가져와 wrapped_games_reports에 upsert
// 인증 필수 (본인만 본인 카드 생성)
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOwnedGames, getRecentlyPlayedGames, fetchGenreStats } from '@/lib/api/steam';
import {
  toRecentTopGames,
  toRecentObsession,
  toAllTimeTopGames,
  toGenreMix,
  toTotalHours,
  toLibraryStats,
  type SteamGame,
} from '@/lib/wrapped/game-aggregate';
import type { WrappedGameGenre } from '@/lib/wrapped/game-types';
import { DEFAULT_TONE } from '@/lib/wrapped/tones';

interface SteamOwnedGameRaw {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url?: string;
}

interface SteamRecentGameRaw {
  appid: number;
  name: string;
  playtime_2weeks: number;
  img_icon_url?: string;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Steam 연동 확인
    const { data: connection } = await supabase
      .from('platform_connections')
      .select('platform_user_id')
      .eq('user_id', user.id)
      .eq('platform', 'steam')
      .maybeSingle();

    if (!connection?.platform_user_id) {
      return NextResponse.json(
        { error: 'Steam이 연동되어 있지 않아요. 프로필에서 먼저 연동해주세요.' },
        { status: 400 }
      );
    }

    // Owned + Recent 병렬 호출 (Steam Web API는 빠름)
    const [ownedRes, recentRes] = await Promise.all([
      getOwnedGames(connection.platform_user_id),
      getRecentlyPlayedGames(connection.platform_user_id),
    ]);

    const ownedRaw: SteamOwnedGameRaw[] = ownedRes?.response?.games ?? [];
    const recentRaw: SteamRecentGameRaw[] = recentRes?.response?.games ?? [];
    const totalOwnedCount: number = ownedRes?.response?.game_count ?? ownedRaw.length;

    if (ownedRaw.length === 0) {
      return NextResponse.json(
        { error: 'Steam 라이브러리가 비어있어요. 프로필 공개 설정도 확인해주세요.' },
        { status: 400 }
      );
    }

    const ownedGames: SteamGame[] = ownedRaw.map((g) => ({
      appid: g.appid,
      name: g.name,
      playtime_minutes: g.playtime_forever,
    }));

    const recentGames: SteamGame[] = recentRaw.map((g) => ({
      appid: g.appid,
      name: g.name,
      playtime_minutes: g.playtime_2weeks,
    }));

    // 장르 집계 — 누적 플레이타임 기준 상위 15개 게임의 장르 (fetchGenreStats가 내부 슬라이스)
    // Store API 호출 1~3초 소요. 실패해도 다른 카드는 살림.
    let genreMix: WrappedGameGenre[] = [];
    try {
      const genreStats = await fetchGenreStats(
        ownedGames
          .filter((g) => g.playtime_minutes > 0)
          .sort((a, b) => b.playtime_minutes - a.playtime_minutes)
      );
      genreMix = toGenreMix(genreStats, 5);
    } catch (err) {
      console.error('[wrapped-games/generate] 장르 집계 실패', err);
    }

    // 카드별 집계
    const recentTopGames = toRecentTopGames(recentGames, 5);
    const recentObsession = toRecentObsession(recentGames);
    const allTimeTopGames = toAllTimeTopGames(ownedGames, 5);
    const totalHours = toTotalHours(ownedGames);
    const libraryStats = toLibraryStats(ownedGames, totalOwnedCount);

    // 푸터 캐시용 프로필
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname, avatar_url')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('wrapped_games_reports')
      .upsert({
        user_id: user.id,
        tone: DEFAULT_TONE,
        recent_top_games: recentTopGames,
        recent_obsession: recentObsession,
        all_time_top_games: allTimeTopGames,
        genre_mix: genreMix,
        total_hours: totalHours,
        library_stats: libraryStats,
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[wrapped-games/generate] DB upsert 실패', error);
      return NextResponse.json({ error: 'DB 저장 실패' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[wrapped-games/generate]', err);
    return NextResponse.json({ error: '생성 실패' }, { status: 500 });
  }
}
