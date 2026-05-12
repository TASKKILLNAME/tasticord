// 공개 공유 페이지 — /wrapped/[userId]
// 비로그인자도 접속 가능 (미들웨어에서 exclude)
// 서버 컴포넌트로 데이터 미리 조회 후 클라이언트 슬라이더에 전달
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { TONES, type ToneId } from '@/lib/wrapped/tones';
import type { WrappedReport } from '@/lib/wrapped/types';
import WrappedView from './WrappedView';

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function WrappedSharePage({ params }: Props) {
  const { userId } = await params;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('wrapped_reports')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    notFound();
  }

  const report = data as WrappedReport;
  const tone = TONES[(report.tone as ToneId) ?? 'A'];

  return <WrappedView report={report} tone={tone} />;
}
