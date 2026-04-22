import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getValidSpotifyToken } from '@/lib/api/spotify-token';
import { searchTrack, createPlaylist } from '@/lib/api/spotify';

// Tasticord 플레이리스트 → Spotify 플레이리스트 내보내기
// - 각 곡을 Spotify에서 검색해서 Spotify URI 수집
// - 새 Spotify 플레이리스트 생성 + 트랙 추가
// - 결과: webUrl(웹), appUri(앱), addedSongs, skipped
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    // 멤버십 확인
    const { data: membership } = await admin
      .from('playlist_members')
      .select('role')
      .eq('playlist_id', id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: '플레이리스트 멤버가 아닙니다' }, { status: 403 });
    }

    // 플레이리스트 + 곡 목록 병렬 조회
    const [playlistRes, songsRes] = await Promise.all([
      admin.from('shared_playlists').select('name').eq('id', id).single(),
      admin
        .from('playlist_songs')
        .select('title, artist, spotify_uri')
        .eq('playlist_id', id)
        .order('added_at', { ascending: true }),
    ]);

    const playlist = playlistRes.data;
    const songs = songsRes.data || [];

    if (!playlist) return NextResponse.json({ error: '플레이리스트를 찾을 수 없습니다' }, { status: 404 });
    if (songs.length === 0) return NextResponse.json({ error: '곡이 없습니다' }, { status: 400 });

    // Spotify 토큰 (미연동이면 null)
    const token = await getValidSpotifyToken();
    if (!token) {
      return NextResponse.json({ error: 'Spotify 연동이 필요합니다' }, { status: 400 });
    }

    // 각 곡을 Spotify에서 검색 (이미 spotify_uri 있으면 그대로)
    const trackUris: string[] = [];
    const skipped: string[] = [];

    for (const song of songs) {
      // 이미 spotify_uri가 저장되어 있으면 그대로 사용
      if (song.spotify_uri) {
        trackUris.push(song.spotify_uri);
        continue;
      }

      // Spotify 검색 "title artist"
      try {
        const query = `${song.title} ${song.artist}`;
        const result = await searchTrack(token.accessToken, query);
        const found = result?.tracks?.items?.[0];
        if (found?.uri) {
          trackUris.push(found.uri);
        } else {
          skipped.push(`${song.title} - ${song.artist}`);
        }
      } catch {
        skipped.push(`${song.title} - ${song.artist}`);
      }
    }

    if (trackUris.length === 0) {
      return NextResponse.json({
        error: 'Spotify에서 곡을 찾을 수 없습니다',
        skipped,
      }, { status: 400 });
    }

    // Spotify 플레이리스트 생성 (100개씩 나눠서 추가하도록 createPlaylist 내부 개선 필요 - 일단 기존 함수 사용)
    const spotifyPlaylist = await createPlaylist(
      token.accessToken,
      token.spotifyUserId!,
      `${playlist.name} (Tasticord)`,
      trackUris.slice(0, 100) // Spotify API 트랙 추가 한 번에 100개 제한
    );

    if (!spotifyPlaylist?.id) {
      return NextResponse.json({ error: 'Spotify 플레이리스트 생성 실패' }, { status: 500 });
    }

    // 100개 초과분은 추가로 업로드
    if (trackUris.length > 100) {
      for (let i = 100; i < trackUris.length; i += 100) {
        const chunk = trackUris.slice(i, i + 100);
        try {
          await fetch(`https://api.spotify.com/v1/playlists/${spotifyPlaylist.id}/tracks`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uris: chunk }),
          });
        } catch { /* skip failures */ }
      }
    }

    return NextResponse.json({
      webUrl: spotifyPlaylist.external_urls?.spotify || `https://open.spotify.com/playlist/${spotifyPlaylist.id}`,
      appUri: `spotify:playlist:${spotifyPlaylist.id}`,
      playlistId: spotifyPlaylist.id,
      totalSongs: songs.length,
      addedSongs: trackUris.length,
      skipped,
    });
  } catch (e) {
    console.error('POST /api/playlists/[id]/export-spotify error:', e);
    return NextResponse.json({ error: '내보내기 실패' }, { status: 500 });
  }
}
