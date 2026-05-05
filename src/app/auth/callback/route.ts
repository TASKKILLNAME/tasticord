import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// 친구 동기화는 메인 흐름을 막지 않도록 백그라운드에서 실행
// 단일 사용자 콜백 핸들러 안에서 N+1 쿼리를 돌리던 기존 로직을 단일 쿼리로 단축
async function syncKakaoFriends(userId: string, providerToken: string) {
  try {
    const admin = createAdminClient();

    const friendsRes = await fetch('https://kapi.kakao.com/v1/api/talk/friends', {
      headers: { Authorization: `Bearer ${providerToken}` },
      // 카카오 API 5초 타임아웃
      signal: AbortSignal.timeout(5000),
    });

    if (!friendsRes.ok) return;
    const friendsData = await friendsRes.json();
    const elements = (friendsData.elements || []) as Array<{ id: number }>;
    if (elements.length === 0) return;

    const kakaoIds = elements.map((f) => f.id);

    // 한 번에 모든 가입 친구 조회 (N+1 → 1 쿼리)
    const { data: registeredProfiles } = await admin
      .from('profiles')
      .select('id, kakao_id')
      .in('kakao_id', kakaoIds);

    if (!registeredProfiles || registeredProfiles.length === 0) return;

    // 양방향 friendships upsert를 배치로
    const myEdges = registeredProfiles.map((p) => ({
      user_id: userId,
      friend_id: p.id,
      kakao_friend_id: p.kakao_id,
    }));
    const reverseEdges = registeredProfiles.map((p) => ({
      user_id: p.id,
      friend_id: userId,
      kakao_friend_id: null,
    }));

    await admin.from('friendships').upsert(myEdges, { onConflict: 'user_id,friend_id' });
    await admin.from('friendships').upsert(reverseEdges, { onConflict: 'user_id,friend_id' });
  } catch (e) {
    console.error('[auth/callback] friend sync failed:', e);
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth`);
  }

  const user = data.session.user;
  const providerToken = data.session.provider_token;

  // 프로필 upsert는 즉시 (반드시 동기 처리)
  const admin = createAdminClient();
  await admin.from('profiles').upsert(
    {
      id: user.id,
      nickname:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.preferred_username ||
        '사용자',
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      kakao_id: user.user_metadata?.provider_id ? parseInt(user.user_metadata.provider_id) : null,
    },
    { onConflict: 'id' },
  );

  // 친구 동기화는 백그라운드 (await 안 함) — 리다이렉트가 친구 수에 영향받지 않음
  // 첫 동기화는 좀 늦더라도 친구 페이지의 수동 동기화 버튼으로 보완 가능
  if (providerToken) {
    void syncKakaoFriends(user.id, providerToken);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
