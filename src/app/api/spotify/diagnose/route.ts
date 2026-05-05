import { NextResponse } from 'next/server';
import { getValidSpotifyToken } from '@/lib/api/spotify-token';

// Spotify 진단 — 실제 토큰으로 me/playlists 호출해서 어디서 막히는지 확인
export async function GET() {
  const token = await getValidSpotifyToken();
  if (!token) {
    return NextResponse.json({ error: 'no token' }, { status: 400 });
  }

  // 1) /v1/me — 토큰 유효성 + 유저 정보
  const meRes = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token.accessToken}` },
  });
  const meText = await meRes.text();
  let meBody: unknown;
  try { meBody = JSON.parse(meText); } catch { meBody = meText; }

  // 2) 시험적으로 빈 플레이리스트 생성 시도
  const createRes = await fetch(
    `https://api.spotify.com/v1/users/${token.spotifyUserId}/playlists`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Tasticord 진단 (삭제됨)', public: false }),
    },
  );
  const createText = await createRes.text();
  let createBody: unknown;
  try { createBody = JSON.parse(createText); } catch { createBody = createText; }

  // 만약 생성 성공했으면 즉시 unfollow (정리)
  let cleaned = false;
  if (createRes.ok && typeof createBody === 'object' && createBody && 'id' in createBody) {
    const playlistId = (createBody as { id: string }).id;
    const delRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/followers`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.accessToken}` },
    });
    cleaned = delRes.ok;
  }

  return NextResponse.json({
    storedSpotifyUserId: token.spotifyUserId,
    me: { status: meRes.status, body: meBody },
    create: { status: createRes.status, body: createBody, cleaned },
  });
}
