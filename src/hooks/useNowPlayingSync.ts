'use client';

import { useEffect } from 'react';

const POLL_INTERVAL_MS = 3 * 60 * 1000; // 3분

/**
 * 로그인된 유저의 Spotify 현재 재생곡을 3분마다 서버에 보고해 user_now_playing 캐시를 갱신.
 * - 탭이 보이지 않는 동안엔 호출하지 않음 (visibilitychange)
 * - 백그라운드 → 포그라운드 복귀 시 즉시 1회 호출
 * (main) 레이아웃에서 1번만 마운트.
 */
export function useNowPlayingSync() {
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (cancelled || document.hidden) return;
      try {
        await fetch('/api/now-playing/sync', { method: 'POST' });
      } catch (e) {
        console.error('[NowPlayingSync] tick failed:', e);
      }
    };

    // 마운트 시 1회 즉시
    tick();

    const interval = setInterval(tick, POLL_INTERVAL_MS);

    const onVisible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}
