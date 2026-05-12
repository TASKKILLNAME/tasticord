'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import PlatformTag from '@/components/ui/PlatformTag';
import MusicEmbed from './MusicEmbed';
import GameEmbed from './GameEmbed';
import MovieEmbed from './MovieEmbed';
import FeedActions from './FeedActions';
import CommentThread from './CommentThread';
import { useToast } from '@/components/ui/ToastProvider';
import { timeAgo } from '@/lib/utils/helpers';
import { ACTIVITY_LABELS } from '@/lib/utils/constants';
import type { Activity } from '@/types';

interface FeedCardProps {
  activity: Activity;
  currentUserId?: string | null;
  onDeleted?: (activityId: string) => void;
}

export default function FeedCard({ activity, currentUserId, onDeleted }: FeedCardProps) {
  const { toast } = useToast();
  const isLive = activity.activity_type === 'listening' || activity.activity_type === 'playing';
  const isRecommend = activity.activity_type === 'recommend';
  const statusColor =
    activity.activity_type === 'listening'
      ? 'text-emerald-400'
      : activity.activity_type === 'playing'
      ? 'text-blue-400'
      : 'text-zinc-400';

  // metadata.text 가 있으면 사용자가 작성한 캡션 — 임베드 위에 표시
  const captionText = (activity.content_metadata?.text as string | undefined) ?? '';
  const isTextOnly = activity.platform === 'tasticord';
  const isOwner = !!currentUserId && currentUserId === activity.user_id;

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(activity.comments_count ?? 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  const handleDelete = async () => {
    if (deleting) return;
    if (!window.confirm('이 게시물을 삭제할까요?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/activities/${activity.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error ?? '삭제에 실패했어요');
        return;
      }
      toast.success('삭제됐어요');
      onDeleted?.(activity.id);
    } catch {
      toast.error('네트워크 오류로 삭제에 실패했어요');
    } finally {
      setDeleting(false);
      setMenuOpen(false);
    }
  };

  return (
    <div
      className={`bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-2xl p-6 transition-all hover:scale-[1.005] ${
        isLive && activity.activity_type === 'listening' ? 'shadow-[0_0_20px_rgba(16,185,129,.12)]' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <Avatar
            name={activity.profile?.nickname || ''}
            imageUrl={activity.profile?.avatar_url}
            {...(isRecommend ? {} : { online: isLive })}
          />
          <div>
            <span className="font-semibold">{activity.profile?.nickname}</span>
            {isLive && (
              <span className={`ml-2 text-xs font-bold tracking-wider uppercase ${statusColor}`}>
                <span className="inline-block animate-pulse">●</span>{' '}
                {ACTIVITY_LABELS[activity.activity_type]}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-zinc-500">{timeAgo(activity.created_at)}</span>
          {!isTextOnly && <PlatformTag platform={activity.platform} />}
          {/* 본인 게시물 — 메뉴 (삭제) — PlatformTag 아래에 위치 */}
          {isOwner && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="게시물 메뉴"
                className="p-1 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-20 min-w-[120px] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 animate-fade-in">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800/60 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 사용자가 작성한 텍스트 캡션 */}
      {captionText && (
        <div className="mb-3 text-sm text-zinc-200 whitespace-pre-wrap break-words leading-relaxed">
          {captionText}
        </div>
      )}

      {/* 첨부 임베드 — 텍스트 only(platform=tasticord)일 땐 안 그림 */}
      {['spotify', 'apple_music'].includes(activity.platform) && (
        <MusicEmbed activity={activity} />
      )}
      {activity.platform === 'steam' && <GameEmbed activity={activity} />}
      {activity.platform === 'netflix' && <MovieEmbed activity={activity} />}

      <FeedActions
        activityId={activity.id}
        likesCount={activity.likes_count || 0}
        commentsCount={commentsCount}
        isLiked={activity.is_liked || false}
        onToggleComments={() => setCommentsOpen((v) => !v)}
        commentsOpen={commentsOpen}
      />

      {commentsOpen && (
        <CommentThread
          activityId={activity.id}
          onCountChange={(delta) => setCommentsCount((c) => c + delta)}
        />
      )}
    </div>
  );
}
