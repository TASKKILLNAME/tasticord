const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  return res.json();
}

async function spotifyFetch(endpoint: string, accessToken: string) {
  const res = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  return res.json();
}

export async function getCurrentlyPlaying(accessToken: string) {
  return spotifyFetch('/me/player/currently-playing', accessToken);
}

export async function getTopTracks(accessToken: string, timeRange: string = 'medium_term', limit: number = 20) {
  return spotifyFetch(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`, accessToken);
}

export async function getTopArtists(accessToken: string, timeRange: string = 'medium_term', limit: number = 20) {
  return spotifyFetch(`/me/top/artists?time_range=${timeRange}&limit=${limit}`, accessToken);
}

export async function getRecentlyPlayed(accessToken: string, limit: number = 20) {
  return spotifyFetch(`/me/player/recently-played?limit=${limit}`, accessToken);
}

// 아티스트 여러 명의 정보 조회 (최대 50명)
export async function getArtists(accessToken: string, artistIds: string[]) {
  const ids = artistIds.slice(0, 50).join(',');
  return spotifyFetch(`/artists?ids=${ids}`, accessToken);
}

export async function searchTrack(accessToken: string, query: string) {
  return spotifyFetch(`/search?q=${encodeURIComponent(query)}&type=track&limit=10`, accessToken);
}

// 빈 Spotify 플레이리스트 생성 — 트랙 추가는 별도 호출(addTracksToPlaylist) 사용
// 실패 시 상세 에러를 throw 해서 호출 측에서 적절히 처리하도록 한다.
export async function createPlaylist(accessToken: string, userId: string, name: string) {
  const createRes = await fetch(`${SPOTIFY_API_BASE}/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, public: false }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => '');
    throw new Error(`Spotify createPlaylist failed: status=${createRes.status} body=${errText}`);
  }

  const playlist = await createRes.json();
  if (!playlist?.id) {
    throw new Error('Spotify createPlaylist: id missing in response');
  }
  return playlist;
}

// 플레이리스트에 트랙 추가 — 응답 검증, 한 번에 최대 100개 제한 지킴
// 실패 시 false 반환 + 콘솔 에러 (호출 측에서 청크별 카운트)
export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[],
): Promise<boolean> {
  if (trackUris.length === 0) return true;
  if (trackUris.length > 100) {
    console.error(`[spotify] addTracksToPlaylist: chunk size ${trackUris.length} > 100`);
    return false;
  }
  try {
    const res = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: trackUris }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[spotify] addTracksToPlaylist failed status=${res.status} body=${errText}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[spotify] addTracksToPlaylist threw', err);
    return false;
  }
}

export { refreshAccessToken };
