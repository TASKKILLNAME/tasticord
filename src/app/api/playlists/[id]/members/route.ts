import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// UUID v1-v5 형식 검증 (Supabase는 uuid v4 사용, 하지만 일반 UUID 형식도 통과하도록 느슨히)
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_REGEX.test(v);

// 방장인지 확인하는 공통 헬퍼
async function isOwner(admin: ReturnType<typeof createAdminClient>, playlistId: string, userId: string) {
  const { data } = await admin
    .from('shared_playlists')
    .select('created_by')
    .eq('id', playlistId)
    .maybeSingle();
  return data?.created_by === userId;
}

// 타겟 유저가 플레이리스트 멤버인지 확인
async function getMembership(
  admin: ReturnType<typeof createAdminClient>,
  playlistId: string,
  memberUserId: string,
) {
  const { data } = await admin
    .from('playlist_members')
    .select('id, role, user_id')
    .eq('playlist_id', playlistId)
    .eq('user_id', memberUserId)
    .maybeSingle();
  return data;
}

// 멤버 초대 — 방장만 가능, 신규 멤버는 뷰어로 시작
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: 'invalid playlist id' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    if (!(await isOwner(admin, id, user.id))) {
      return NextResponse.json({ error: '방장만 초대할 수 있습니다' }, { status: 403 });
    }

    const { memberId } = await request.json();
    if (!isUuid(memberId)) return NextResponse.json({ error: 'invalid memberId' }, { status: 400 });

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

// 멤버 역할 변경 — 방장만 가능, 타겟이 실제 멤버여야 함
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: 'invalid playlist id' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    if (!(await isOwner(admin, id, user.id))) {
      return NextResponse.json({ error: '방장만 권한을 변경할 수 있습니다' }, { status: 403 });
    }

    const { memberId, role } = await request.json();
    if (!isUuid(memberId)) return NextResponse.json({ error: 'invalid memberId' }, { status: 400 });
    if (!role) return NextResponse.json({ error: 'role required' }, { status: 400 });
    // owner 직접 지정은 여기서 허용하지 않음 (양도는 별도 흐름)
    if (!['editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'invalid role' }, { status: 400 });
    }

    // 타겟이 실제 이 플레이리스트의 멤버인지 검증
    const target = await getMembership(admin, id, memberId);
    if (!target) {
      return NextResponse.json({ error: '대상 멤버를 찾을 수 없습니다' }, { status: 404 });
    }
    // 방장의 역할은 여기서 변경하지 않음
    if (target.role === 'owner') {
      return NextResponse.json({ error: '방장의 역할은 변경할 수 없습니다' }, { status: 400 });
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

// 멤버 추방 — 방장만 가능, 본인 제거 불가, 타겟이 실제 멤버여야 함
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: 'invalid playlist id' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    if (!(await isOwner(admin, id, user.id))) {
      return NextResponse.json({ error: '방장만 추방할 수 있습니다' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    if (!isUuid(memberId)) return NextResponse.json({ error: 'invalid memberId' }, { status: 400 });
    if (memberId === user.id) {
      return NextResponse.json({ error: '본인은 추방할 수 없습니다' }, { status: 400 });
    }

    // 타겟이 실제 멤버인지 사전 검증 (race condition 최소화 위해 직전에 조회)
    const target = await getMembership(admin, id, memberId);
    if (!target) {
      return NextResponse.json({ error: '대상 멤버를 찾을 수 없습니다' }, { status: 404 });
    }
    // 방장은 방장을 추방할 수 없음 (본인이든 타인이든)
    if (target.role === 'owner') {
      return NextResponse.json({ error: '방장은 추방할 수 없습니다' }, { status: 400 });
    }

    // 방장 권한을 마지막 순간에 재확인해 race condition을 더 줄인다
    if (!(await isOwner(admin, id, user.id))) {
      return NextResponse.json({ error: '방장만 추방할 수 있습니다' }, { status: 403 });
    }

    const { error: deleteError } = await admin
      .from('playlist_members')
      .delete()
      .eq('playlist_id', id)
      .eq('user_id', memberId);

    if (deleteError) throw deleteError;

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
