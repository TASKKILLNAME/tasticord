// DELETE /api/activities/[id] — 본인 게시물 삭제
// RLS 정책으로 user_id = auth.uid() 일 때만 통과
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // RLS가 본인 소유 여부 강제 — 본인 아니면 0 row 영향
    const { error, count } = await supabase
      .from('activities')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[activities DELETE]', error);
      return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
    }

    if (!count || count === 0) {
      return NextResponse.json({ error: '삭제할 게시물을 찾지 못했어요' }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('[activities DELETE]', err);
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
  }
}
