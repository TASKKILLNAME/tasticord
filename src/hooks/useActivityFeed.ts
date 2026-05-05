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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { activities, loading };
}
