import { NextResponse } from 'next/server';
import { getValidSpotifyToken } from '@/lib/api/spotify-token';
import { getCurrentlyPlaying as getSpotifyCurrent } from '@/lib/api/spotify';
import { getCurrentlyPlaying as getSteamCurrent } from '@/lib/api/steam';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type UpsertRow = {
  user_id: string;
  kind: 'music' | 'game';
  platform: string;
  track_id: string | null;
  title: string;
  artist: string | null;
  album_image_url: string | null;
  external_url: string | null;
  played_at: string;
  updated_at: string;
};

// 클라이언트 폴러가 3분 주기로 호출.
// Spotify(음악) + Steam(게임) 활동을 병렬로 가져와 user_now_playing 에 kind별 upsert.
// 활동이 없으면 해당 kind는 갱신을 건너뜀 → 4분 룰에 따라 자연 만료.
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date().toISOString();
    const upserts: UpsertRow[] = [];

    // 두 플랫폼 병렬 실행 (한쪽 실패해도 다른 쪽은 진행)
    const [musicResult, gameResult] = await Promise.allSettled([
      buildMusicRow(user.id, now),
      buildGameRow(user.id, now, supabase),
    ]);

    if (musicResult.status === 'fulfilled' && musicResult.value) {
      upserts.push(musicResult.value);
    }
    if (gameResult.status === 'fulfilled' && gameResult.value) {
      upserts.push(gameResult.value);
    }

    if (upserts.length === 0) {
      return NextResponse.json({ status: 'idle' });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('user_now_playing')
      .upsert(upserts, { onConflict: 'user_id,kind' });

    if (error) {
      console.error('[now-playing/sync] upsert failed:', error);
      return NextResponse.json({ error: 'Cache write failed' }, { status: 500 });
    }

    return NextResponse.json({
      status: 'ok',
      updated: upserts.map((u) => u.kind),
    });
  } catch (e) {
    console.error('[now-playing/sync] error:', e);
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
  }
}

async function buildMusicRow(userId: string, now: string): Promise<UpsertRow | null> {
  const token = await getValidSpotifyToken();
  if (!token) return null;

  const data = await getSpotifyCurrent(token.accessToken);
  if (!data?.is_playing || !data?.item) return null;

  const item = data.item as {
    id?: string;
    name?: string;
    artists?: { name: string }[];
    album?: { images?: { url: string }[] };
    external_urls?: { spotify?: string };
  };
  if (!item.name) return null;

  return {
    user_id: userId,
    kind: 'music',
    platform: 'spotify',
    track_id: item.id ?? null,
    title: item.name,
    artist: item.artists?.map((a) => a.name).join(', ') ?? null,
    album_image_url: item.album?.images?.[0]?.url ?? null,
    external_url: item.external_urls?.spotify ?? null,
    played_at: now,
    updated_at: now,
  };
}

async function buildGameRow(
  userId: string,
  now: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<UpsertRow | null> {
  const { data: connection } = await supabase
    .from('platform_connections')
    .select('platform_user_id')
    .eq('user_id', userId)
    .eq('platform', 'steam')
    .maybeSingle();

  if (!connection?.platform_user_id) return null;

  const data = await getSteamCurrent(connection.platform_user_id);
  if (!data?.isPlaying || !data?.gameName) return null;

  return {
    user_id: userId,
    kind: 'game',
    platform: 'steam',
    track_id: data.gameId ? String(data.gameId) : null,
    title: data.gameName,
    artist: null,
    album_image_url: data.gameId
      ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${data.gameId}/header.jpg`
      : null,
    external_url: data.gameId
      ? `https://store.steampowered.com/app/${data.gameId}`
      : null,
    played_at: now,
    updated_at: now,
  };
}
