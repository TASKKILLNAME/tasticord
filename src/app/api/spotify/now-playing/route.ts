import { NextResponse } from 'next/server';
import { getValidSpotifyToken } from '@/lib/api/spotify-token';
import { getCurrentlyPlaying } from '@/lib/api/spotify';
import { logActivity } from '@/lib/activity-logger';

type SpotifyImage = { url: string };
type SpotifyArtist = { name: string };
type SpotifyTrack = {
  id?: string;
  name?: string;
  artists?: SpotifyArtist[];
  album?: { name?: string; images?: SpotifyImage[] };
  external_urls?: { spotify?: string };
};
type NowPlayingResponse = {
  is_playing?: boolean;
  item?: SpotifyTrack | null;
};

export async function GET() {
  try {
    const token = await getValidSpotifyToken();
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = (await getCurrentlyPlaying(token.accessToken)) as NowPlayingResponse | null;

    // fire-and-forget: 재생 중인 트랙이 있으면 activity 기록
    const trackName = data?.item?.name;
    if (data?.is_playing && trackName) {
      const track = data.item!;
      const artists = track.artists?.map((a) => a.name).filter(Boolean).join(', ') || '';
      const imageUrl = track.album?.images?.[0]?.url;
      const externalUrl = track.external_urls?.spotify;

      // await 하지 않음 (응답 지연 방지)
      void logActivity({
        userId: token.userId,
        platform: 'spotify',
        activityType: 'listening',
        contentTitle: trackName,
        contentSubtitle: artists || undefined,
        contentImageUrl: imageUrl,
        contentExternalUrl: externalUrl,
        contentMetadata: {
          track_id: track.id,
          album: track.album?.name,
        },
      });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
