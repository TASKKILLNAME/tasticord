import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// 플레이리스트 커버 이미지 업로드 — 방장/편집자만 가능
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    // FormData에서 파일 추출
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 });

    // 확장자 추출
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${id}/cover-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // 스토리지 버킷에 업로드
    const { error: uploadError } = await admin.storage
      .from('playlist-covers')
      .upload(path, uint8, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: '업로드 실패' }, { status: 500 });
    }

    // public URL 조회
    const { data: publicUrlData } = admin.storage.from('playlist-covers').getPublicUrl(path);
    const cover_url = publicUrlData.publicUrl;

    // 플레이리스트 cover_url 갱신
    await admin.from('shared_playlists').update({ cover_url }).eq('id', id);

    return NextResponse.json({ cover_url });
  } catch {
    return NextResponse.json({ error: 'Failed to upload' }, { status: 500 });
  }
}
