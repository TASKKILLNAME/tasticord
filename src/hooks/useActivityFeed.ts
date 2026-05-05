'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PresenceActivity } from './useActivityPresence';

const supabase = createClient();
const CHANNEL_NAME = 'activities';

/**
 * 홈 피드에서 전체 유저 활동 상태를 실시간 수신.
 * Presence sync/join/leave 이벤트로 즉시 반영.
 */
export function useActivityFeed() {
  const [activities, setActivities] = useState<PresenceActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: 'user_id' } },
    });

    const refresh = () => {
      const state = channel.presenceState<PresenceActivity>();
      const list = Object.values(state)
        .flat()
        .sort(
          (a, b) =>
            new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
        );
      setActivities(list);
      setLoading(false);
    };

    channel
      .on('presence', { event: 'sync' }, refresh)
      .on('presence', { event: 'join' }, refresh)
      .on('presence', { event: 'leave' }, refresh)
      .subscribe((status) => {
        // 활동 중인 유저가 0명이면 sync 이벤트가 안 올 수 있어
        // 구독 성공 시점에 일단 loading을 풀고 빈 상태를 보여준다
        if (status === 'SUBSCRIBED') {
          refresh();
        }
      });

    // 안전망: 3초 안에 어떤 이벤트도 안 오면 강제로 로딩 해제
    const timer = setTimeout(() => setLoading(false), 3000);

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  return { activities, loading };
}
