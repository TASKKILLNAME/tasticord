import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getValidSpotifyToken } from '@/lib/api/spotify-token';
import { searchTrack, createPlaylist, addTracksToPlaylist } from '@/lib/api/spotify';

// Tasticord 플레이리스트 → Spotify 플레이리스트 내보내기
//
// 개선 사항:
// 1) Spotify 검색을 5개씩 병렬로 처리 (Vercel 10초 타임아웃 회피)
// 2) createPlaylist 응답 검증 (lib에서 throw → 여기서 catch해서 명확한 에러 메시지 반환)
// 3) 트랙 추가는 별도 호출 (addTracksToPlaylist) — 청크별 성공/실패 정확히 카운트
// 4) spotifyUserId null/undefined 사전 검증
const SEARCH_BATCH_SIZE = 5;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    // Spotify 토큰 (미연동/만료면 null)
    const token = await getValidSpotifyToken();
    if (!token) {
      return NextResponse.json({ error: 'Spotify 연동이 필요합니다. 다시 로그인해주세요.' }, { status: 400 });
    }
    if (!token.spotifyUserId) {
      console.error('[export-spotify] spotifyUserId missing on connection');
      return NextResponse.json(
        { error: 'Spotify 사용자 정보가 누락되었습니다. 프로필 → Spotify 재연동을 시도해주세요.' },
        { status: 400 },
      );
    }

    // 1) 곡 검색 — 5개씩 병렬 처리
    // 이미 spotify_uri가 저장되어 있으면 그대로 사용 (재검색 스킵)
    const trackUris: string[] = [];
    const skipped: string[] = [];

    const songsNeedingSearch: typeof songs = [];
    for (const song of songs) {
      if (song.spotify_uri) {
        trackUris.push(song.spotify_uri);
      } else {
        songsNeedingSearch.push(song);
      }
    }

    // 병렬 배치 검색
    for (let i = 0; i < songsNeedingSearch.length; i += SEARCH_BATCH_SIZE) {
      const batch = songsNeedingSearch.slice(i, i + SEARCH_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (song) => {
          const query = `${song.title} ${song.artist}`;
          const result = await searchTrack(token.accessToken, query);
          const uri = result?.tracks?.items?.[0]?.uri as string | undefined;
          return { song, uri };
        }),
      );

      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value.uri) {
            trackUris.push(r.value.uri);
          } else {
            skipped.push(`${r.value.song.title} - ${r.value.song.artist}`);
          }
        } else {
          // 검색 자체 실패 (네트워크/401 등) — 어느 곡인지 모르므로 일반 메시지
          console.error('[export-spotify] searchTrack failed:', r.reason);
        }
      }
    }

    if (trackUris.length === 0) {
      return NextResponse.json(
        {
          error: 'Spotify에서 곡을 찾을 수 없습니다',
          skipped,
        },
        { status: 400 },
      );
    }

    // 2) Spotify 플레이리스트 생성 (빈 상태)
    let spotifyPlaylist;
    try {
      spotifyPlaylist = await createPlaylist(
        token.accessToken,
        token.spotifyUserId,
        `${playlist.name} (Tasticord)`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown';
      console.error('[export-spotify] createPlaylist threw:', message);

      // 401/403은 권한 문제로 추정 (Dev Mode 등록 안 된 사용자, 토큰 만료)
      if (message.includes('status=401')) {
        return NextResponse.json(
          { error: 'Spotify 권한이 만료되었습니다. 프로필에서 재연동해주세요.' },
          { status: 401 },
        );
      }
      if (message.includes('status=403')) {
        return NextResponse.json(
          {
            error:
              'Spotify 계정에 권한이 없습니다. 개발자 대시보드에 사용자 등록이 필요할 수 있습니다.',
          },
          { status: 403 },
        );
      }
      return NextResponse.json({ error: 'Spotify 플레이리스트 생성 실패' }, { status: 500 });
    }

    // 3) 트랙 청크별 추가 (재시도 1회 포함, 진짜 성공 카운트)
    let totalChunks = 0;
    let successChunks = 0;
    let failedChunks = 0;
    let addedTrackCount = 0;

    for (let i = 0; i < trackUris.length; i += 100) {
      const chunk = trackUris.slice(i, i + 100);
      totalChunks += 1;

      let ok = await addTracksToPlaylist(token.accessToken, spotifyPlaylist.id, chunk);

      // 1회 재시도
      if (!ok) {
        await new Promise((r) => setTimeout(r, 500));
        ok = await addTracksToPlaylist(token.accessToken, spotifyPlaylist.id, chunk);
        if (ok) {
          console.log(
            `[export-spotify] chunk retry succeeded playlistId=${spotifyPlaylist.id} offset=${i}`,
          );
        }
      }

      if (ok) {
        successChunks += 1;
        addedTrackCount += chunk.length;
      } else {
        failedChunks += 1;
        console.error(
          `[export-spotify] chunk gave up after retry playlistId=${spotifyPlaylist.id} offset=${i} size=${chunk.length}`,
        );
      }
    }

    return NextResponse.json({
      webUrl:
        spotifyPlaylist.external_urls?.spotify ||
        `https://open.spotify.com/playlist/${spotifyPlaylist.id}`,
      appUri: `spotify:playlist:${spotifyPlaylist.id}`,
      playlistId: spotifyPlaylist.id,
      totalSongs: songs.length,
      addedSongs: addedTrackCount,
      skipped,
      totalChunks,
      successChunks,
      failedChunks,
    });
  } catch (e) {
    console.error('POST /api/playlists/[id]/export-spotify error:', e);
    return NextResponse.json({ error: '내보내기 실패' }, { status: 500 });
  }
}
