import { NextResponse } from 'next/server';
import { getValidSpotifyToken } from '@/lib/api/spotify-token';
import { getCurrentlyPlaying } from '@/lib/api/spotify';

// 활동 상태는 Presence로 옮겨졌으므로 더 이상 DB에 INSERT하지 않음
// 클라이언트(useActivityTracker)가 이 응답을 그대로 Presence track에 사용
export async function GET() {
  try {
    const token = await getValidSpotifyToken();
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await getCurrentlyPlaying(token.accessToken);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
