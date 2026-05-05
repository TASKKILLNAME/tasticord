'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Activity, Profile } from '@/types';
import { FILTER_TO_PLATFORM } from '@/lib/utils/constants';

export function useFeed(filter: string = '전체') {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const PAGE_SIZE = 20;

  // 현재 유저 + 친구 id 세트 (realtime 필터링용)
  const allowedUserIdsRef = useRef<Set<string>>(new Set());
  const filterRef = useRef(filter);
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  const fetchActivities = useCallback(async (cursor?: string) => {
    let query = supabase
      .from('activities')
      .select('*, profile:profiles(*)')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    const platforms = FILTER_TO_PLATFORM[filter];
    if (platforms && platforms.length > 0) {
      query = query.in('platform', platforms);
    }

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Feed fetch error:', error);
      setLoading(false);
      return;
    }

    const items = (data || []) as Activity[];
    if (cursor) {
      setActivities((prev) => [...prev, ...items]);
    } else {
      setActivities(items);
    }
    setHasMore(items.length === PAGE_SIZE);
    setLoading(false);
  }, [filter, supabase]);

  useEffect(() => {
    setLoading(true);
    fetchActivities();
  }, [fetchActivities]);

  // 친구 + 자기자신의 user_id set을 최신화 (realtime 필터링에 사용)
  useEffect(() => {
    let cancelled = false;

    async function loadAllowedIds() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id);

      if (cancelled) return;

      const ids = new Set<string>([user.id]);
      for (const f of friendships || []) {
        if (f.friend_id) ids.add(f.friend_id as string);
      }
      allowedUserIdsRef.current = ids;
    }

    loadAllowedIds();
    return () => { cancelled = true; };
  }, [supabase]);

  // Realtime: 새 activity INSERT 감지 → prepend
  useEffect(() => {
    const channel = supabase
      .channel('feed-activities')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        async (payload) => {
          const row = payload.new as Activity;
          if (!row?.id || !row.user_id) return;

          // 친구 또는 본인이 아니면 무시
          if (!allowedUserIdsRef.current.has(row.user_id)) return;

          // 필터 platform 일치 여부 확인
          const platforms = FILTER_TO_PLATFORM[filterRef.current];
          if (platforms && platforms.length > 0 && !platforms.includes(row.platform)) {
            return;
          }

          // 프로필 조인 (realtime payload에는 조인 결과가 없음)
          let profile: Profile | undefined;
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', row.user_id)
            .single();
          if (profileData) profile = profileData as Profile;

          const enriched: Activity = { ...row, profile };

          setActivities((prev) => {
            // 중복 방지
            if (prev.some((a) => a.id === enriched.id)) return prev;
            return [enriched, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const loadMore = () => {
    if (activities.length > 0) {
      fetchActivities(activities[activities.length - 1].created_at);
    }
  };

  return { activities, loading, hasMore, loadMore };
}
