import { createAdminClient } from '@/lib/supabase/admin';

type LogActivityParams = {
  userId: string;
  platform: 'spotify' | 'steam' | 'apple_music' | 'netflix';
  activityType: 'listening' | 'playing' | 'watching';
  contentTitle: string;
  contentSubtitle?: string;
  contentImageUrl?: string;
  contentExternalUrl?: string;
  contentMetadata?: Record<string, unknown>;
};

// 중복 방지: 같은 user+platform+title이 최근 N분 내 기록되었으면 스킵
const DEDUP_WINDOW_MINUTES = 30;

/**
 * 유저 활동을 activities 테이블에 기록.
 * - admin client 사용 (RLS 우회)
 * - fire-and-forget: 에러는 로깅만, throw 하지 않음
 * - 동일 컨텐츠 30분 내 중복은 스킵
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const admin = createAdminClient();

    // Deduplication 체크
    const since = new Date(Date.now() - DEDUP_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { data: recent, error: checkError } = await admin
      .from('activities')
      .select('id')
      .eq('user_id', params.userId)
      .eq('platform', params.platform)
      .eq('content_title', params.contentTitle)
      .gte('created_at', since)
      .limit(1);

    if (checkError) {
      console.error('[activity-logger] dedup check error:', checkError);
      return;
    }

    if (recent && recent.length > 0) {
      // 최근에 같은 활동이 있었음 - skip
      return;
    }

    const { error: insertError } = await admin.from('activities').insert({
      user_id: params.userId,
      platform: params.platform,
      activity_type: params.activityType,
      content_title: params.contentTitle,
      content_subtitle: params.contentSubtitle ?? null,
      content_image_url: params.contentImageUrl ?? null,
      content_external_url: params.contentExternalUrl ?? null,
      content_metadata: params.contentMetadata ?? {},
    });

    if (insertError) {
      console.error('[activity-logger] insert error:', insertError);
    }
  } catch (err) {
    console.error('[activity-logger] unexpected error:', err);
  }
}
