import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// 메시지 페이지의 "플레이리스트" 탭용 — 내가 속한 플레이리스트 요약 리스트
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    // 1) 내 멤버십으로부터 플레이리스트 id + 내 role 조회
    const { data: myMemberships } = await admin
      .from('playlist_members')
      .select('playlist_id, role')
      .eq('user_id', user.id);

    const plIds = (myMemberships || []).map((m) => m.playlist_id);
    if (plIds.length === 0) return NextResponse.json({ playlists: [] });

    const myRoleMap: Record<string, string> = {};
    for (const m of myMemberships || []) myRoleMap[m.playlist_id] = m.role;

    // 2) 병렬로 플레이리스트 본체 + 전체 멤버 + 전체 곡 조회
    const [playlistsRes, allMembersRes, allSongsRes] = await Promise.all([
      admin
        .from('shared_playlists')
        .select('*')
        .in('id', plIds)
        .order('updated_at', { ascending: false }),
      admin.from('playlist_members').select('playlist_id').in('playlist_id', plIds),
      admin.from('playlist_songs').select('playlist_id').in('playlist_id', plIds),
    ]);

    // 각 플레이리스트의 멤버 수/곡 수 집계
    const memberCountMap: Record<string, number> = {};
    for (const m of allMembersRes.data || []) {
      memberCountMap[m.playlist_id] = (memberCountMap[m.playlist_id] || 0) + 1;
    }
    const songCountMap: Record<string, number> = {};
    for (const s of allSongsRes.data || []) {
      songCountMap[s.playlist_id] = (songCountMap[s.playlist_id] || 0) + 1;
    }

    const playlists = (playlistsRes.data || []).map((p) => ({
      id: p.id,
      name: p.name,
      cover_url: p.cover_url || null,
      updated_at: p.updated_at,
      memberCount: memberCountMap[p.id] || 0,
      songCount: songCountMap[p.id] || 0,
      myRole: myRoleMap[p.id] || 'viewer',
    }));

    return NextResponse.json({ playlists });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
