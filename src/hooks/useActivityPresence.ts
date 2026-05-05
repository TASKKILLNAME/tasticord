'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// 피드에 표시할 실시간 활동 타입 (Presence ephemeral state)
export type PresenceActivity = {
  user_id: string;
  username: string;
  avatar_url?: string | null;
  type: 'listening' | 'gaming' | 'watching' | 'idle';
  // 플랫폼 ID (spotify | steam | netflix | apple_music)
  platform: string;
  title: string;
  detail?: string;        // 아티스트명, 게임 정보 등
  image_url?: string | null;
  external_url?: string | null;
  started_at: string;
};

// 모듈 레벨 클라이언트 — Presence 채널은 앱 전체에서 1개만 유지
const supabase = createClient();
const CHANNEL_NAME = 'activities';

let sharedChannel: RealtimeChannel | null = null;

function getOrCreateChannel(): RealtimeChannel {
  if (sharedChannel) return sharedChannel;
  sharedChannel = supabase.channel(CHANNEL_NAME, {
    config: { presence: { key: 'user_id' } },
  });
  sharedChannel.subscribe();
  return sharedChannel;
}

/**
 * 내 활동 상태를 Presence에 등록/업데이트하는 훅.
 * 페이지 이탈 시 자동 untrack.
 */
export function useTrackActivity() {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    channelRef.current = getOrCreateChannel();
    return () => {
      // 마지막 사용자가 떠날 때만 untrack — 다른 곳에서 같은 채널 쓰면 유지
      channelRef.current?.untrack();
    };
  }, []);

  const setActivity = async (activity: Omit<PresenceActivity, 'started_at'>) => {
    const channel = channelRef.current;
    if (!channel) return;
    await channel.track({
      ...activity,
      started_at: new Date().toISOString(),
    });
  };

  const clearActivity = async () => {
    await channelRef.current?.untrack();
  };

  return { setActivity, clearActivity };
}
