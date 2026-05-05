import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentlyPlaying } from '@/lib/api/steam';

// 활동 상태는 Presence로 옮겨졌으므로 더 이상 DB에 INSERT하지 않음
// 클라이언트(useActivityTracker)가 이 응답을 그대로 Presence track에 사용
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

    const data = await getCurrentlyPlaying(connection.platform_user_id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
