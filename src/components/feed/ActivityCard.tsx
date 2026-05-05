'use client';

import Avatar from '@/components/ui/Avatar';
import PlatformTag from '@/components/ui/PlatformTag';
import { timeAgo } from '@/lib/utils/helpers';
import type { PresenceActivity } from '@/hooks/useActivityPresence';

interface ActivityCardProps {
  activity: PresenceActivity;
}

const TYPE_LABEL: Record<PresenceActivity['type'], string> = {
  listening: 'LISTENING NOW',
  gaming: 'PLAYING NOW',
  watching: 'WATCHING NOW',
  idle: '',
};

const TYPE_COLOR: Record<PresenceActivity['type'], string> = {
  listening: 'text-emerald-400',
  gaming: 'text-blue-400',
  watching: 'text-red-400',
  idle: 'text-zinc-400',
};

export default function ActivityCard({ activity }: ActivityCardProps) {
  const isLive = activity.type !== 'idle';
  const statusColor = TYPE_COLOR[activity.type];
  const glow =
    activity.type === 'listening'
      ? 'shadow-[0_0_20px_rgba(16,185,129,.12)]'
      : activity.type === 'gaming'
      ? 'shadow-[0_0_20px_rgba(59,130,246,.12)]'
      : '';

  return (
    <div
      className={`bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-2xl p-6 transition-all hover:scale-[1.005] ${glow}`}
    >
      {/* 헤더 */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <Avatar
            name={activity.username || ''}
            imageUrl={activity.avatar_url || undefined}
            online={isLive}
          />
          <div>
            <span className="font-semibold">{activity.username}</span>
            {isLive && (
              <span className={`ml-2 text-xs font-bold tracking-wider uppercase ${statusColor}`}>
                <span className="inline-block animate-pulse">●</span> {TYPE_LABEL[activity.type]}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-zinc-500">{timeAgo(activity.started_at)}</span>
          <div className="mt-0.5">
            <PlatformTag platform={activity.platform} />
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex items-center gap-4">
        {activity.image_url ? (
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0 bg-cover bg-center bg-zinc-800"
            style={{ backgroundImage: `url('${activity.image_url}')` }}
          />
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0 bg-zinc-800" />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-zinc-100 text-base truncate">{activity.title}</div>
          {activity.detail && (
            <div className="text-sm text-zinc-400 mt-0.5 truncate">{activity.detail}</div>
          )}
          {activity.external_url && (
            <a
              href={activity.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-xs text-zinc-300 hover:text-white transition"
            >
              열어보기 ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
