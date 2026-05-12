// /analysis 페이지의 "음악 카드" 섹션
// - Spotify 미연동: 안내 + 연동 유도
// - 카드 미생성: 기간 선택 + "만들기" 버튼
// - 카드 생성됨: 미리보기 썸네일 + 공유 링크 복사 + 기간 변경 후 다시 만들기
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Share2, RefreshCw, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/ToastProvider';
import {
  type WrappedReport,
  type TimeRange,
  TIME_RANGE_LABELS,
  DEFAULT_TIME_RANGE,
} from '@/lib/wrapped/types';

const TIME_RANGE_OPTIONS: TimeRange[] = ['short_term', 'medium_term', 'long_term'];

// 기간 세그먼트 버튼 — 디자인 일관성 위해 컴포넌트로 분리
function TimeRangePicker({
  value,
  onChange,
  disabled,
}: {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/30 mb-3">
      {TIME_RANGE_OPTIONS.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            disabled={disabled}
            className={`py-2 rounded-lg text-xs font-semibold transition ${
              selected
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            } disabled:opacity-50`}
          >
            {TIME_RANGE_LABELS[opt].ko}
          </button>
        );
      })}
    </div>
  );
}

export default function WrappedSection() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<WrappedReport | null>(null);
  const [hasSpotify, setHasSpotify] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>(DEFAULT_TIME_RANGE);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: existing }, { data: conn }] = await Promise.all([
        supabase.from('wrapped_reports').select('*').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('platform_connections')
          .select('id')
          .eq('user_id', user.id)
          .eq('platform', 'spotify')
          .maybeSingle(),
      ]);

      const existingReport = existing as WrappedReport | null;
      setReport(existingReport);
      // 기존 카드 있으면 그 기간을 셀렉터 초기값으로
      if (existingReport?.time_range) {
        setSelectedRange(existingReport.time_range);
      }
      setHasSpotify(!!conn);
      setLoading(false);
    }
    load();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/wrapped/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_range: selectedRange }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? '생성에 실패했어요');
        return;
      }
      setReport(json);
      toast.success('음악 카드가 만들어졌어요!');
    } catch {
      toast.error('네트워크 오류로 생성에 실패했어요');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!userId) return;
    const url = `${window.location.origin}/wrapped/${userId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('공유 링크가 복사됐어요');
    } catch {
      toast.error('복사 실패 — 링크를 직접 선택해주세요');
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-2xl p-6 animate-pulse h-32" />
    );
  }

  // Spotify 미연동
  if (!hasSpotify) {
    return (
      <div className="rounded-2xl p-6 mb-6 bg-gradient-to-br from-green-500/15 to-emerald-500/10 border border-green-500/20">
        <div className="flex items-start gap-3 mb-3">
          <Music className="w-5 h-5 text-green-400 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">음악 카드</div>
            <div className="text-sm text-zinc-400 leading-relaxed">
              Spotify를 연동하면 Top 아티스트·트랙·장르를 카드로 만들어 친구들에게 공유할 수 있어요.
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push('/profile')}
          className="text-sm font-semibold text-green-300 hover:text-green-200 transition"
        >
          프로필에서 Spotify 연동하기 →
        </button>
      </div>
    );
  }

  // 카드 미생성 — 기간 선택 + 만들기
  if (!report) {
    return (
      <div className="rounded-2xl p-6 mb-6 bg-gradient-to-br from-green-500/15 to-emerald-500/10 border border-green-500/20">
        <div className="flex items-start gap-3 mb-4">
          <Music className="w-5 h-5 text-green-400 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">음악 카드 만들기</div>
            <div className="text-sm text-zinc-400 leading-relaxed">
              기간을 선택하면 그 기간의 Top 5 아티스트·트랙·장르를 카드로 만들어드려요.
            </div>
          </div>
        </div>
        <TimeRangePicker
          value={selectedRange}
          onChange={setSelectedRange}
          disabled={generating}
        />
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm disabled:opacity-50 hover:bg-zinc-100 transition"
        >
          {generating ? '만드는 중…' : '음악 카드 만들기'}
        </button>
      </div>
    );
  }

  // 카드 생성됨
  const generatedAt = new Date(report.generated_at);
  const currentRangeLabel = TIME_RANGE_LABELS[report.time_range ?? 'long_term'].ko;
  const willRegenerate = selectedRange !== report.time_range;

  return (
    <div className="rounded-2xl p-6 mb-6 bg-gradient-to-br from-green-500/15 to-emerald-500/10 border border-green-500/20">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="font-semibold mb-1">내 음악 카드</div>
          <div className="text-xs text-zinc-500">
            {currentRangeLabel} ·{' '}
            {generatedAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 생성
          </div>
        </div>
        <Music className="w-5 h-5 text-green-400" />
      </div>

      {/* 기간 변경하면 다시 만들기 버튼 활성화 */}
      <TimeRangePicker
        value={selectedRange}
        onChange={setSelectedRange}
        disabled={generating}
      />

      <div className="flex gap-2">
        <button
          onClick={() => userId && router.push(`/wrapped/${userId}`)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-100 transition"
        >
          <ExternalLink className="w-4 h-4" />
          카드 보기
        </button>
        <button
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 text-white font-semibold text-sm hover:bg-zinc-700 transition"
        >
          <Share2 className="w-4 h-4" />
          링크 복사
        </button>
        <button
          onClick={handleGenerate}
          disabled={generating}
          aria-label={willRegenerate ? '선택한 기간으로 다시 만들기' : '다시 만들기'}
          title={willRegenerate ? '선택한 기간으로 다시 만들기' : '다시 만들기'}
          className={`px-3 py-2.5 rounded-xl font-semibold text-white transition disabled:opacity-50 ${
            willRegenerate
              ? 'bg-green-500 hover:bg-green-400'
              : 'bg-zinc-800 hover:bg-zinc-700'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
