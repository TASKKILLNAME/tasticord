'use client';

// 홈 피드 상단 컴포저 — 텍스트 + 선택적 음악/게임/영화 첨부
import { useState } from 'react';
import { Plus, X, Music, Gamepad2, Film, Send } from 'lucide-react';
import AttachmentSheet from '@/components/chat/AttachmentSheet';
import { useToast } from '@/components/ui/ToastProvider';
import type { EmbedType } from '@/types';

type EmbedPayload = {
  music: { title: string; artist: string; image_url: string | null; spotify_id: string; url: string };
  game: { title: string; image_url: string; steam_app_id: number; url: string };
  movie: { title: string; image_url: string | null; url: string };
};

type Attachment =
  | { kind: 'music'; data: EmbedPayload['music'] }
  | { kind: 'game'; data: EmbedPayload['game'] }
  | { kind: 'movie'; data: EmbedPayload['movie'] };

interface Props {
  onPosted?: () => void;
}

const KIND_ICON: Record<Attachment['kind'], typeof Music> = {
  music: Music,
  game: Gamepad2,
  movie: Film,
};

export default function CreatePostBox({ onPosted }: Props) {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSelectAttachment = <T extends EmbedType>(type: T, data: EmbedPayload[NonNullable<T>]) => {
    if (!type) return;
    setAttachment({ kind: type, data } as Attachment);
  };

  const canSubmit = (text.trim().length > 0 || attachment !== null) && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      let body: Record<string, unknown>;
      const trimmedText = text.trim();

      if (attachment) {
        // 첨부 + 텍스트 (텍스트 옵셔널)
        body =
          attachment.kind === 'music'
            ? {
                kind: 'music',
                title: attachment.data.title,
                subtitle: attachment.data.artist,
                image_url: attachment.data.image_url,
                external_url: attachment.data.url,
                metadata: { spotify_id: attachment.data.spotify_id, text: trimmedText || undefined },
              }
            : attachment.kind === 'game'
            ? {
                kind: 'game',
                title: attachment.data.title,
                image_url: attachment.data.image_url,
                external_url: attachment.data.url,
                metadata: { steam_app_id: attachment.data.steam_app_id, text: trimmedText || undefined },
              }
            : {
                kind: 'movie',
                title: attachment.data.title,
                image_url: attachment.data.image_url,
                external_url: attachment.data.url,
                metadata: { text: trimmedText || undefined },
              };
      } else {
        // 텍스트 only
        body = {
          kind: 'text',
          title: trimmedText,
          metadata: { text: trimmedText },
        };
      }

      const res = await fetch('/api/feed/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error ?? '등록에 실패했어요');
        return;
      }
      toast.success('피드에 올라갔어요');
      setText('');
      setAttachment(null);
      onPosted?.();
    } catch {
      toast.error('네트워크 오류로 등록에 실패했어요');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-2xl p-4 mb-6">
        {/* 텍스트 입력 */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="무엇을 추천해볼까요?"
          rows={2}
          maxLength={500}
          className="w-full bg-transparent border-none outline-none resize-none text-sm placeholder-zinc-500 text-zinc-100"
        />

        {/* 첨부 미리보기 */}
        {attachment && (
          <div className="flex items-center gap-3 mt-2 p-2 pr-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
            {attachment.data.image_url ? (
              <img
                src={attachment.data.image_url}
                alt=""
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-zinc-700 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-zinc-100 truncate">{attachment.data.title}</div>
              {attachment.kind === 'music' && (
                <div className="text-xs text-zinc-500 truncate">{attachment.data.artist}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              aria-label="첨부 제거"
              className="text-zinc-500 hover:text-zinc-300 transition flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 액션 바 */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/40">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition"
          >
            {attachment ? (
              <>
                {(() => {
                  const Icon = KIND_ICON[attachment.kind];
                  return <Icon className="w-4 h-4" />;
                })()}
                첨부 변경
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                음악/게임/영화 첨부
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 active:scale-95 transition"
          >
            <Send className="w-3.5 h-3.5" />
            올리기
          </button>
        </div>
      </div>

      <AttachmentSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelect={handleSelectAttachment}
        title="첨부 카드 고르기"
      />
    </>
  );
}
