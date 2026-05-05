'use client';

import { useActivityTracker } from '@/hooks/useActivityTracker';

// (main) 레이아웃에 단 1번만 마운트되어 Spotify/Steam 활동을 Presence에 반영
// 클라이언트 컴포넌트라 layout.tsx(서버 컴포넌트)에서 직접 훅을 못 써서 분리
export default function ActivityTrackerMount() {
  useActivityTracker();
  return null;
}
