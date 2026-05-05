import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 홈 피드: 본인 + 친구의 user_now_playing 행 중 played_at이 3시간 이내인 것만 반환.
// RLS 가 본인+친구로 이미 제한하므로 별도 join 필요 없음.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('user_now_playing')
      .select(`
        user_id,
        kind,
        platform,
        track_id,
        title,
        artist,
        album_image_url,
        external_url,
        played_at,
        profiles:user_id ( nickname, avatar_url )
      `)
      .gte('played_at', threeHoursAgo)
      .order('played_at', { ascending: false });

    if (error) {
      console.error('[now-playing/feed] select failed:', error);
      return NextResponse.json({ error: 'Read failed' }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    console.error('[now-playing/feed] error:', e);
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 });
  }
}
