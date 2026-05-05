import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentlyPlaying } from '@/lib/api/steam';
import { logActivity } from '@/lib/activity-logger';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: connection } = await supabase
      .from('platform_connections')
      .select('platform_user_id')
      .eq('user_id', user.id)
      .eq('platform', 'steam')
      .single();

    if (!connection?.platform_user_id) {
      return NextResponse.json({ error: 'Steam not connected' }, { status: 400 });
    }

    // 현재 플레이 중인 게임은 실시간 데이터라 캐싱하지 않음
    const data = await getCurrentlyPlaying(connection.platform_user_id);

    // fire-and-forget: 플레이 중인 게임이 있으면 activity 기록
    if (data?.isPlaying && data.gameName) {
      const gameId = data.gameId ? String(data.gameId) : null;
      const headerUrl = gameId
        ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${gameId}/header.jpg`
        : undefined;
      const storeUrl = gameId ? `https://store.steampowered.com/app/${gameId}` : undefined;

      void logActivity({
        userId: user.id,
        platform: 'steam',
        activityType: 'playing',
        contentTitle: data.gameName,
        contentImageUrl: headerUrl,
        contentExternalUrl: storeUrl,
        contentMetadata: {
          game_id: gameId,
        },
      });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
