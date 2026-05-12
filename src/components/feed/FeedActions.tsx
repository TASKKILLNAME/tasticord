'use client';

import { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';

interface FeedActionsProps {
  activityId: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  onToggleComments?: () => void;
  commentsOpen?: boolean;
}

export default function FeedActions({
  activityId,
  likesCount,
  commentsCount,
  isLiked: initialIsLiked,
  onToggleComments,
  commentsOpen,
}: FeedActionsProps) {
  const [liked, setLiked] = useState(initialIsLiked);
  const [likes, setLikes] = useState(likesCount);
  const [pending, setPending] = useState(false);

  const handleLike = async () => {
    if (pending) return;
    // Optimistic 업데이트
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));
    setPending(true);
    try {
      const res = await fetch(`/api/activities/${activityId}/like`, {
        method: nextLiked ? 'POST' : 'DELETE',
      });
      if (!res.ok) {
        // 롤백
        setLiked(!nextLiked);
        setLikes((c) => (nextLiked ? Math.max(0, c - 1) : c + 1));
      }
    } catch {
      setLiked(!nextLiked);
      setLikes((c) => (nextLiked ? Math.max(0, c - 1) : c + 1));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex gap-1 mt-4">
      <button
        onClick={handleLike}
        disabled={pending}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition disabled:opacity-60 ${
          liked ? 'text-pink-400 hover:text-pink-300' : 'text-zinc-500 hover:text-zinc-300'
        } hover:bg-zinc-800/50`}
      >
        <Heart className={`w-4 h-4 ${liked ? 'fill-pink-400' : ''}`} />
        {likes > 0 && likes}
      </button>
      <button
        type="button"
        onClick={onToggleComments}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition hover:bg-zinc-800/50 ${
          commentsOpen ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <MessageCircle className={`w-4 h-4 ${commentsOpen ? 'fill-zinc-400/20' : ''}`} />
        {commentsCount > 0 && commentsCount}
      </button>
    </div>
  );
}
