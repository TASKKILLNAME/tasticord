import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

/**
 * Refresh a Spotify access token with exponential backoff retry.
 * 3 attempts with 100ms / 300ms / 700ms backoff.
 * Only retries on network errors and non-401 error statuses.
 * Returns { access_token: null } if refresh token is invalid (401) or all retries fail.
 */
async function refreshAccessTokenWithRetry(
  refreshToken: string
): Promise<{ access_token: string | null; expires_in?: number }> {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64')}`,
  };
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers,
        body,
      });
      if (res.ok) {
        return res.json();
      }
      if (res.status === 401) {
        // Invalid refresh token — no point retrying
        return { access_token: null };
      }
      // other non-OK status: fall through to retry
    } catch {
      // network error: fall through to retry
    }
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 100 * Math.pow(3, attempt)));
    }
  }
  return { access_token: null };
}

/**
 * 현재 유저의 유효한 Spotify access_token을 반환.
 * 만료되었으면 자동으로 refresh 후 DB 업데이트.
 * 반환: { accessToken, userId } 또는 null (미연동/미인증)
 */
export async function getValidSpotifyToken() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: connection } = await supabase
    .from('platform_connections')
    .select('access_token, refresh_token, token_expires_at, platform_user_id')
    .eq('user_id', user.id)
    .eq('platform', 'spotify')
    .single();

  if (!connection?.access_token || !connection?.refresh_token) return null;

  // 토큰이 아직 유효하면 그대로 반환 (1분 여유)
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;

  if (Date.now() < expiresAt - 60_000) {
    return {
      accessToken: connection.access_token,
      userId: user.id,
      spotifyUserId: connection.platform_user_id,
    };
  }

  // 토큰 갱신 (재시도 포함)
  const refreshed = await refreshAccessTokenWithRetry(connection.refresh_token);
  if (!refreshed.access_token || !refreshed.expires_in) return null;

  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  const admin = createAdminClient();
  await admin.from('platform_connections').update({
    access_token: refreshed.access_token,
    token_expires_at: newExpiresAt,
  }).eq('user_id', user.id).eq('platform', 'spotify');

  return {
    accessToken: refreshed.access_token,
    userId: user.id,
    spotifyUserId: connection.platform_user_id,
  };
}
