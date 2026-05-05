import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// 내가 속한 플레이리스트 전체 조회 (기존 구조 유지)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase
      .from('shared_playlists')
      .select('*, playlist_members(user_id, role, profiles:profiles(*)), playlist_songs(*)')
      .order('updated_at', { ascending: false });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// 새 플레이리스트 생성 — 생성자는 방장, 초대받은 친구는 편집자
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, memberIds } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    // RLS 우회를 위해 admin 클라이언트 사용
    const admin = createAdminClient();

    // 1) 플레이리스트 row 생성
    const { data: playlist, error } = await admin
      .from('shared_playlists')
      .insert({ name, created_by: user.id })
      .select()
      .single();

    if (error || !playlist) throw error;

    // 2) 멤버 등록 (생성자=방장, 초대 멤버=편집자)
    const members = [
      { playlist_id: playlist.id, user_id: user.id, role: 'owner' as const },
      ...((memberIds || []) as string[]).map((userId) => ({
        playlist_id: playlist.id,
        user_id: userId,
        role: 'editor' as const,
      })),
    ];

    await admin.from('playlist_members').insert(members);

    // 3) 플레이리스트 전용 채팅방 생성
    const { data: chatRoom } = await admin
      .from('chat_rooms')
      .insert({ type: 'playlist', playlist_id: playlist.id })
      .select()
      .single();

    // 채팅방 멤버도 함께 추가 (플레이리스트 멤버와 동일)
    if (chatRoom) {
      const chatMembers = members.map((m) => ({
        room_id: chatRoom.id,
        user_id: m.user_id,
      }));
      await admin.from('chat_members').insert(chatMembers);
    }

    return NextResponse.json(playlist);
  } catch {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
