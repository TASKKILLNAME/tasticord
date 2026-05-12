// POST/DELETE /api/activities/[id]/like — 좋아요 토글
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('activity_likes')
      .insert({ activity_id: id, user_id: user.id });

    // UNIQUE 위반(이미 좋아요됨)도 OK 처리
    if (error && error.code !== '23505') {
      console.error('[like POST]', error);
      return NextResponse.json({ error: 'DB 저장 실패' }, { status: 500 });
    }

    return NextResponse.json({ liked: true });
  } catch (err) {
    console.error('[like POST]', err);
    return NextResponse.json({ error: '실패' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('activity_likes')
      .delete()
      .eq('activity_id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[like DELETE]', error);
      return NextResponse.json({ error: 'DB 삭제 실패' }, { status: 500 });
    }

    return NextResponse.json({ liked: false });
  } catch (err) {
    console.error('[like DELETE]', err);
    return NextResponse.json({ error: '실패' }, { status: 500 });
  }
}
