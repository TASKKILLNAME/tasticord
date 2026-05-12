'use client';

// 피드 카드 안에서 펼쳐지는 댓글 thread
// 마운트 시 댓글 목록 fetch + 입력창
import { useEffect, useState, useCallback, useRef } from 'react';
import { Send } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { timeAgo } from '@/lib/utils/helpers';

interface Comment {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: { id: string; nickname: string; avatar_url: string | null } | null;
}

interface Props {
  activityId: string;
  onCountChange?: (delta: number) => void; // 새 댓글 작성 시 부모 카운트 갱신용
}

export default function CommentThread({ activityId, onCountChange }: Props) {
  const [items, setItems] = useState<Comment[] | null>(null);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/activities/${activityId}/comments`);
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = (await res.json()) as { items: Comment[] };
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    }
  }, [activityId]);

  useEffect(() => {
    load();
    // 입력창에 자동 포커스
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/activities/${activityId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) return;
      const newComment = (await res.json()) as Comment;
      setItems((prev) => [...(prev ?? []), newComment]);
      setText('');
      onCountChange?.(1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-zinc-800/40 space-y-3">
      {/* 댓글 목록 */}
      {items === null ? (
        <div className="text-xs text-zinc-500">댓글 불러오는 중…</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-zinc-500">첫 댓글을 남겨보세요</div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar
                name={c.profile?.nickname ?? '사용자'}
                imageUrl={c.profile?.avatar_url}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-zinc-200">
                    {c.profile?.nickname ?? '사용자'}
                  </span>
                  <span className="text-[10px] text-zinc-500">{timeAgo(c.created_at)}</span>
                </div>
                <div className="text-sm text-zinc-300 mt-0.5 whitespace-pre-wrap break-words">
                  {c.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 댓글 입력 */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="댓글 쓰기…"
          maxLength={500}
          className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full px-4 py-2 text-sm placeholder-zinc-500 outline-none focus:border-zinc-500 transition"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          aria-label="댓글 전송"
          className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-40 hover:scale-105 active:scale-95 transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
