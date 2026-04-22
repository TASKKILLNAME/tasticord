import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Odesli(song.link) API로 곡의 각 플랫폼 링크를 한 번에 조회
// 3초 타임아웃 — 느리면 포기하고 나중에 백필
async function getSongLinks(url: string): Promise<Record<string, string>> {
  if (!url) return {};
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(url)}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) return {};
    const data = await res.json();
    const platforms = (data?.linksByPlatform || {}) as Record<
      string,
      { url?: string; nativeAppUriMobile?: string; nativeAppUriDesktop?: string }
    >;

    const links: Record<string, string> = {};
    if (platforms.spotify?.url) links.spotify_url = platforms.spotify.url;
    if (platforms.spotify?.nativeAppUriMobile) links.spotify_app = platforms.spotify.nativeAppUriMobile;
    if (platforms.appleMusic?.url) links.apple_music_url = platforms.appleMusic.url;
    if (platforms.appleMusic?.nativeAppUriMobile) links.apple_music_app = platforms.appleMusic.nativeAppUriMobile;
    // YouTube Music 우선, 없으면 일반 YouTube fallback
    if (platforms.youtubeMusic?.url) links.youtube_url = platforms.youtubeMusic.url;
    else if (platforms.youtube?.url) links.youtube_url = platforms.youtube.url;

    return links;
  } catch {
    return {};
  }
}

// 플레이리스트에 곡 추가 — 방장/편집자만 가능
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    // 멤버십 확인 — 방장 또는 편집자만 곡 추가 허용
    const { data: membership } = await admin
      .from('playlist_members')
      .select('role')
      .eq('playlist_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (membership.role !== 'owner' && membership.role !== 'editor') {
      return NextResponse.json({ error: '편집 권한이 없습니다' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      artist,
      album,
      image_url,
      spotify_uri,
      apple_music_id,
      duration_ms,
      preview_url,
      external_url,
      genre,
    } = body;

    if (!title || !artist) {
      return NextResponse.json({ error: 'title/artist required' }, { status: 400 });
    }

    // 1) 곡 insert + Odesli 병렬 조회 (Odesli가 느려도 insert는 기다리지 않음)
    const [insertResult, links] = await Promise.all([
      admin
        .from('playlist_songs')
        .insert({
          playlist_id: id,
          added_by: user.id,
          title,
          artist,
          album: album || null,
          image_url: image_url || null,
          spotify_uri: spotify_uri || null,
          apple_music_id: apple_music_id || null,
          duration_ms: duration_ms || null,
          preview_url: preview_url || null,
          external_url: external_url || null,
          genre: genre || null,
        })
        .select()
        .single(),
      external_url ? getSongLinks(external_url) : Promise.resolve({}),
    ]);

    if (insertResult.error || !insertResult.data) throw insertResult.error;
    const song = insertResult.data;

    // 2) 플레이리스트 updated_at 갱신 (메시지 목록 정렬용)
    await admin.from('shared_playlists').update({ updated_at: new Date().toISOString() }).eq('id', id);

    // 3) Odesli 링크가 있으면 비동기로 update (응답은 기다리지 않음)
    if (Object.keys(links).length > 0) {
      admin
        .from('playlist_songs')
        .update({ links })
        .eq('id', song.id)
        .then(() => {});
    }

    return NextResponse.json({ ...song, links });
  } catch {
    return NextResponse.json({ error: 'Failed to add song' }, { status: 500 });
  }
}
