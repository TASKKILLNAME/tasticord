import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface KakaoFriend {
  id: number;
  uuid?: string;
  profile_nickname?: string;
  profile_thumbnail_image?: string;
}

interface KakaoFriendsResponse {
  elements?: KakaoFriend[];
  total_count?: number;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const providerToken = session.provider_token;

    if (!providerToken) {
      return NextResponse.json(
        { error: '재로그인이 필요합니다' },
        { status: 400 }
      );
    }

    const friendsRes = await fetch('https://kapi.kakao.com/v1/api/talk/friends', {
      headers: { Authorization: `Bearer ${providerToken}` },
    });

    if (!friendsRes.ok) {
      if (friendsRes.status === 401) {
        return NextResponse.json(
          { error: '재로그인이 필요합니다' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: '카카오 친구 목록을 가져올 수 없습니다' },
        { status: 500 }
      );
    }

    const friendsData: KakaoFriendsResponse = await friendsRes.json();
    const admin = createAdminClient();

    let synced = 0;
    let newFriends = 0;

    for (const friend of friendsData.elements || []) {
      const { data: friendProfile } = await admin
        .from('profiles')
        .select('id')
        .eq('kakao_id', friend.id)
        .single();

      if (!friendProfile) continue;

      // check if friendship already exists
      const { data: existing } = await admin
        .from('friendships')
        .select('id')
        .eq('user_id', user.id)
        .eq('friend_id', friendProfile.id)
        .maybeSingle();

      const isNew = !existing;

      const { error: err1 } = await admin.from('friendships').upsert(
        {
          user_id: user.id,
          friend_id: friendProfile.id,
          kakao_friend_id: friend.id,
        },
        { onConflict: 'user_id,friend_id' }
      );

      const { error: err2 } = await admin.from('friendships').upsert(
        {
          user_id: friendProfile.id,
          friend_id: user.id,
          kakao_friend_id: null,
        },
        { onConflict: 'user_id,friend_id' }
      );

      if (!err1 && !err2) {
        synced += 1;
        if (isNew) newFriends += 1;
      }
    }

    return NextResponse.json({ synced, newFriends });
  } catch (e) {
    console.error('Kakao sync error:', e);
    return NextResponse.json(
      { error: '동기화 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
