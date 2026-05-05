import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

// Spotify 연동 상세 진단 — 어느 단계에서 실패하는지 추적
export async function GET() {
  const result: Record<string, unknown> = {};

  // 1) 로그인 확인
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ step: 'auth', error: '로그인 안 됨' }, { status: 401 });
  }
  result.userId = user.id;

  // 2) 연동 row 조회 (admin 사용해서 RLS 우회 — 실제 데이터 확인)
  const admin = createAdminClient();
  const { data: connection } = await admin
    .from('platform_connections')
    .select('access_token, refresh_token, token_expires_at, platform_user_id, platform_username, connected_at')
    .eq('user_id', user.id)
    .eq('platform', 'spotify')
    .maybeSingle();

  if (!connection) {
    return NextResponse.json({
      step: 'connection',
      error: '이 유저는 Spotify 미연동',
      userId: user.id,
    });
  }

  result.platform_user_id = connection.platform_user_id;
  result.platform_username = connection.platform_username;
  result.connected_at = connection.connected_at;
  result.token_expires_at = connection.token_expires_at;
  result.has_access_token = !!connection.access_token;
  result.has_refresh_token = !!connection.refresh_token;

  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;
  const now = Date.now();
  result.is_expired = now > expiresAt - 60_000;
  result.expires_in_seconds = Math.round((expiresAt - now) / 1000);

  // 3) 토큰이 유효하면 그걸로 me/playlist 시도
  let accessToken = connection.access_token;

  if (result.is_expired) {
    // 4) 리프레시 시도
    if (!connection.refresh_token) {
      return NextResponse.json({ ...result, step: 'refresh', error: 'refresh_token 없음' });
    }

    try {
      const refreshRes = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
          ).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token,
        }),
      });

      const refreshText = await refreshRes.text();
      result.refresh_status = refreshRes.status;
      try {
        result.refresh_body = JSON.parse(refreshText);
      } catch {
        result.refresh_body = refreshText;
      }

      if (!refreshRes.ok) {
        return NextResponse.json({ ...result, step: 'refresh', error: '리프레시 실패' });
      }

      const refreshed = JSON.parse(refreshText);
      accessToken = refreshed.access_token;

      // DB 업데이트
      await admin
        .from('platform_connections')
        .update({
          access_token: refreshed.access_token,
          token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        })
        .eq('user_id', user.id)
        .eq('platform', 'spotify');

      result.refreshed = true;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'unknown';
      return NextResponse.json({ ...result, step: 'refresh_throw', error: message });
    }
  }

  // 5) /v1/me 호출
  const meRes = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const meText = await meRes.text();
  result.me_status = meRes.status;
  try {
    result.me_body = JSON.parse(meText);
  } catch {
    result.me_body = meText;
  }

  // 6) 시험 플레이리스트 생성
  const createRes = await fetch(
    `https://api.spotify.com/v1/users/${connection.platform_user_id}/playlists`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Tasticord 진단 (삭제됨)', public: false }),
    },
  );
  const createText = await createRes.text();
  result.create_status = createRes.status;
  try {
    result.create_body = JSON.parse(createText);
  } catch {
    result.create_body = createText;
  }

  // 성공 시 정리
  if (createRes.ok && typeof result.create_body === 'object' && result.create_body && 'id' in result.create_body) {
    const pid = (result.create_body as { id: string }).id;
    await fetch(`https://api.spotify.com/v1/playlists/${pid}/followers`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    result.cleaned = true;
  }

  return NextResponse.json(result);
}
