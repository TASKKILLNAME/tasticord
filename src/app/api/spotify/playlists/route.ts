import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPlaylist, addTracksToPlaylist } from '@/lib/api/spotify';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: connection } = await supabase
      .from('platform_connections')
      .select('access_token, platform_user_id')
      .eq('user_id', user.id)
      .eq('platform', 'spotify')
      .single();

    if (!connection?.access_token || !connection?.platform_user_id) {
      return NextResponse.json({ error: 'Spotify not connected' }, { status: 400 });
    }

    const body = await request.json();
    const { name, trackUris } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    const playlist = await createPlaylist(connection.access_token, connection.platform_user_id, name);

    if (Array.isArray(trackUris) && trackUris.length > 0) {
      // 100개씩 나눠 추가
      for (let i = 0; i < trackUris.length; i += 100) {
        const ok = await addTracksToPlaylist(
          connection.access_token,
          playlist.id,
          trackUris.slice(i, i + 100),
        );
        if (!ok) console.error(`[spotify/playlists] chunk add failed offset=${i}`);
      }
    }

    return NextResponse.json(playlist);
  } catch (e) {
    console.error('[spotify/playlists] create failed:', e);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
