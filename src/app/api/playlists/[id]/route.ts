import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// 플레이리스트 상세 조회 — 멤버만 접근 가능
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    // 멤버십, 플레이리스트, 멤버+프로필, 곡+추가자, 채팅방을 병렬로 조회
    const [membershipRes, playlistRes, membersRes, songsRes, chatRoomRes] = await Promise.all([
      admin
        .from('playlist_members')
        .select('role')
        .eq('playlist_id', id)
        .eq('user_id', user.id)
        .maybeSingle(),
      admin.from('shared_playlists').select('*').eq('id', id).maybeSingle(),
      admin
        .from('playlist_members')
        .select('id, user_id, role, joined_at, profile:profiles(*)')
        .eq('playlist_id', id),
      admin
        .from('playlist_songs')
        .select('*, added_by_profile:profiles!playlist_songs_added_by_fkey(*)')
        .eq('playlist_id', id)
        .order('added_at', { ascending: true }),
      admin.from('chat_rooms').select('id').eq('playlist_id', id).maybeSingle(),
    ]);

    if (!membershipRes.data) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!playlistRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      playlist: playlistRes.data,
      members: membersRes.data || [],
      songs: songsRes.data || [],
      myRole: membershipRes.data.role,
      chatRoomId: chatRoomRes.data?.id || null,
      userId: user.id,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// 플레이리스트 삭제 — 방장만 가능
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    // 방장 확인
    const { data: playlist } = await admin
      .from('shared_playlists')
      .select('created_by')
      .eq('id', id)
      .maybeSingle();

    if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (playlist.created_by !== user.id) {
      return NextResponse.json({ error: '방장만 삭제할 수 있습니다' }, { status: 403 });
    }

    // 연관된 채팅방 먼저 삭제 (CASCADE가 아니므로 명시적으로)
    await admin.from('chat_rooms').delete().eq('playlist_id', id);
    await admin.from('shared_playlists').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
