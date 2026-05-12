// GET/POST /api/activities/[id]/comments
// 댓글 목록 조회 + 새 댓글 작성
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface CommentRow {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { id: string; nickname: string; avatar_url: string | null } | null;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// 댓글 목록 조회 — 시간 오름차순 (오래된 댓글이 위)
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('activity_comments')
      .select('id, activity_id, user_id, content, created_at, profiles:user_id (id, nickname, avatar_url)')
      .eq('activity_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[comments GET] failed', error);
      return NextResponse.json({ items: [] });
    }

    const items = (data as unknown as CommentRow[]).map((c) => ({
      id: c.id,
      activity_id: c.activity_id,
      user_id: c.user_id,
      content: c.content,
      created_at: c.created_at,
      profile: c.profiles
        ? { id: c.profiles.id, nickname: c.profiles.nickname, avatar_url: c.profiles.avatar_url }
        : null,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('[comments GET]', err);
    return NextResponse.json({ items: [] });
  }
}

// 댓글 작성
export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: { content?: string } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
    }

    const content = (body.content ?? '').trim();
    if (content.length === 0) {
      return NextResponse.json({ error: '내용을 입력하세요' }, { status: 400 });
    }
    if (content.length > 500) {
      return NextResponse.json({ error: '댓글이 너무 깁니다 (500자 이내)' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('activity_comments')
      .insert({
        activity_id: id,
        user_id: user.id,
        content,
      })
      .select('id, activity_id, user_id, content, created_at, profiles:user_id (id, nickname, avatar_url)')
      .single();

    if (error) {
      console.error('[comments POST] failed', error);
      return NextResponse.json({ error: 'DB 저장 실패' }, { status: 500 });
    }

    const row = data as unknown as CommentRow;
    return NextResponse.json({
      id: row.id,
      activity_id: row.activity_id,
      user_id: row.user_id,
      content: row.content,
      created_at: row.created_at,
      profile: row.profiles
        ? { id: row.profiles.id, nickname: row.profiles.nickname, avatar_url: row.profiles.avatar_url }
        : null,
    });
  } catch (err) {
    console.error('[comments POST]', err);
    return NextResponse.json({ error: '작성 실패' }, { status: 500 });
  }
}
