import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// 방장인지 확인하는 공통 헬퍼
async function isOwner(admin: ReturnType<typeof createAdminClient>, playlistId: string, userId: string) {
  const { data } = await admin
    .from('shared_playlists')
    .select('created_by')
    .eq('id', playlistId)
    .maybeSingle();
  return data?.created_by === userId;
}

// 멤버 초대 — 방장만 가능, 신규 멤버는 뷰어로 시작
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    if (!(await isOwner(admin, id, user.id))) {
      return NextResponse.json({ error: '방장만 초대할 수 있습니다' }, { status: 403 });
    }

    const { memberId } = await request.json();
    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 });

    // 플레이리스트 멤버로 추가
    const { error } = await admin
      .from('playlist_members')
      .insert({ playlist_id: id, user_id: memberId, role: 'viewer' });

    if (error) {
      // 이미 멤버인 경우 unique 제약 위반
      return NextResponse.json({ error: '이미 멤버입니다' }, { status: 400 });
    }

    // 연관 채팅방에도 멤버 추가
    const { data: room } = await admin
      .from('chat_rooms')
      .select('id')
      .eq('playlist_id', id)
      .maybeSingle();

    if (room) {
      await admin
        .from('chat_members')
        .insert({ room_id: room.id, user_id: memberId })
        .then(() => {});
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}

// 멤버 역할 변경 — 방장만 가능
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    if (!(await isOwner(admin, id, user.id))) {
      return NextResponse.json({ error: '방장만 권한을 변경할 수 있습니다' }, { status: 403 });
    }

    const { memberId, role } = await request.json();
    if (!memberId || !role) return NextResponse.json({ error: 'memberId/role required' }, { status: 400 });
    if (!['owner', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'invalid role' }, { status: 400 });
    }

    const { error } = await admin
      .from('playlist_members')
      .update({ role })
      .eq('playlist_id', id)
      .eq('user_id', memberId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// 멤버 추방 — 방장만 가능, 본인은 제거 불가
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    if (!(await isOwner(admin, id, user.id))) {
      return NextResponse.json({ error: '방장만 추방할 수 있습니다' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 });
    if (memberId === user.id) {
      return NextResponse.json({ error: '본인은 추방할 수 없습니다' }, { status: 400 });
    }

    await admin
      .from('playlist_members')
      .delete()
      .eq('playlist_id', id)
      .eq('user_id', memberId);

    // 채팅방에서도 함께 제거
    const { data: room } = await admin
      .from('chat_rooms')
      .select('id')
      .eq('playlist_id', id)
      .maybeSingle();

    if (room) {
      await admin.from('chat_members').delete().eq('room_id', room.id).eq('user_id', memberId);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
