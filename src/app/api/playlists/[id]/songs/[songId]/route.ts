import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// 곡 삭제 — 방장/편집자만 가능
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; songId: string }> }
) {
  try {
    const { id, songId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    // 권한 확인 (방장/편집자만)
    const { data: membership } = await admin
      .from('playlist_members')
      .select('role')
      .eq('playlist_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'editor')) {
      return NextResponse.json({ error: '편집 권한이 없습니다' }, { status: 403 });
    }

    await admin.from('playlist_songs').delete().eq('id', songId).eq('playlist_id', id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete song' }, { status: 500 });
  }
}
