// 공개 공유 페이지 — /wrapped-games/[userId]
// 비로그인자도 접속 가능 (미들웨어에서 exclude)
// 음악 Wrapped와 동일한 패턴 — 서버 컴포넌트에서 데이터 미리 조회
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { TONES, type ToneId } from '@/lib/wrapped/tones';
import type { WrappedGamesReport } from '@/lib/wrapped/game-types';
import WrappedGamesView from './WrappedGamesView';

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function WrappedGamesSharePage({ params }: Props) {
  const { userId } = await params;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('wrapped_games_reports')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    notFound();
  }

  const report = data as WrappedGamesReport;
  const tone = TONES[(report.tone as ToneId) ?? 'A'];

  return <WrappedGamesView report={report} tone={tone} />;
}
