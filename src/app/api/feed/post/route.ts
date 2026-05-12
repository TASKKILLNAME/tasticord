// POST /api/feed/post
// 홈 피드에 사용자 추천 카드 작성 — activities 테이블에 type='recommend' 행 생성
// Body: { kind: 'music' | 'game' | 'movie', title, subtitle, image_url, external_url, metadata, comment? }
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type FeedKind = 'music' | 'game' | 'movie' | 'text';

interface PostBody {
  kind: FeedKind;
  title: string;
  subtitle?: string | null;
  image_url?: string | null;
  external_url?: string | null;
  metadata?: Record<string, unknown>;
  comment?: string | null; // 옵셔널 사용자 코멘트
}

// kind → activities.platform 매핑 (FeedCard 분기와 일관)
// 'text'는 첨부 없이 텍스트만 — platform='tasticord'로 마커
const KIND_TO_PLATFORM: Record<FeedKind, string> = {
  music: 'spotify',
  game: 'steam',
  movie: 'netflix',
  text: 'tasticord',
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: PostBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
    }

    if (!body.kind || !['music', 'game', 'movie', 'text'].includes(body.kind)) {
      return NextResponse.json({ error: 'kind 잘못됨' }, { status: 400 });
    }
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json({ error: '내용 필수' }, { status: 400 });
    }

    const metadata = { ...(body.metadata ?? {}), ...(body.comment ? { comment: body.comment } : {}) };

    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        platform: KIND_TO_PLATFORM[body.kind],
        activity_type: 'recommend',
        content_title: body.title,
        content_subtitle: body.subtitle ?? null,
        content_image_url: body.image_url ?? null,
        content_external_url: body.external_url ?? null,
        content_metadata: metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('[feed/post] insert failed', error);
      return NextResponse.json({ error: 'DB 저장 실패' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[feed/post]', err);
    return NextResponse.json({ error: '작성 실패' }, { status: 500 });
  }
}
