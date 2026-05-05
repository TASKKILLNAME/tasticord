'use client';

import { useNowPlayingSync } from '@/hooks/useNowPlayingSync';

// (main) 레이아웃에 1번만 마운트되어 3분마다 Spotify 현재 재생곡을 캐시.
export default function NowPlayingSyncMount() {
  useNowPlayingSync();
  return null;
}
