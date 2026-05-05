'use client';

import { useEffect, useMemo, useState } from 'react';
import NowPlayingCard from '@/components/feed/NowPlayingCard';
import Chip from '@/components/ui/Chip';
import { useNowPlayingFeed } from '@/hooks/useNowPlayingFeed';
import { FEED_FILTERS, FILTER_TO_PLATFORM } from '@/lib/utils/constants';

export default function FeedPage() {
  const [activeFilter, setActiveFilter] = useState<string>('전체');
  const { items, loading, refresh } = useNowPlayingFeed();

  // 홈 페이지 진입 시 본인 캐시도 즉시 갱신 (3분 폴링과 별개로 즉시 1회)
  // 그 후 피드 재조회 → 본인 새 캐시까지 반영된 결과로 표시
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetch('/api/now-playing/sync', { method: 'POST' });
      } catch {
        // sync 실패해도 피드 자체는 useNowPlayingFeed가 이미 호출 중이라 무시
      }
      if (!cancelled) refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const filtered = useMemo(() => {
    const platforms = FILTER_TO_PLATFORM[activeFilter];
    if (!platforms || platforms.length === 0) return items;
    return items.filter((it) => platforms.includes(it.platform));
  }, [items, activeFilter]);

  return (
    <div className="animate-fade-up">
      {/* 섹션 필터 */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 px-8 py-4">
        <div className="flex space-x-2 max-w-3xl mx-auto">
          {FEED_FILTERS.map((filter) => (
            <Chip
              key={filter}
              label={filter}
              active={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            />
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-8 space-y-6">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-2xl p-6 animate-pulse"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800" />
                  <div className="space-y-2">
                    <div className="w-24 h-4 bg-zinc-800 rounded" />
                    <div className="w-16 h-3 bg-zinc-800 rounded" />
                  </div>
                </div>
                <div className="w-full h-32 bg-zinc-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-zinc-400 text-lg">
              {activeFilter === '전체'
                ? '최근 활동이 없습니다'
                : `${activeFilter} 활동이 없습니다`}
            </div>
            <p className="text-zinc-500 text-sm mt-2">
              플랫폼을 연동하고 친구를 추가하면 활동이 여기에 표시됩니다
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <NowPlayingCard key={`${item.user_id}-${item.kind}`} item={item} />
          ))
        )}
      </div>
    </div>
  );
}
