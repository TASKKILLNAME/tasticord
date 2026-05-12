// 공유 페이지 클라이언트 뷰
// 1~6장은 실데이터, 7~9장은 placeholder (총 9장)
// 친구 비교 카드(Discovery/Friend Match/Common Ground)는 취향 카드 범위에서 제외
'use client';

import WrappedSlider from '@/components/wrapped/WrappedSlider';
import TopArtists from '@/components/wrapped/cards/TopArtists';
import TopTracks from '@/components/wrapped/cards/TopTracks';
import TopGenres from '@/components/wrapped/cards/TopGenres';
import Loyalty from '@/components/wrapped/cards/Loyalty';
import TopAlbum from '@/components/wrapped/cards/TopAlbum';
import TasteShift from '@/components/wrapped/cards/TasteShift';
import PlaceholderCard from '@/components/wrapped/cards/PlaceholderCard';
import type { Tone } from '@/lib/wrapped/tones';
import type { WrappedReport } from '@/lib/wrapped/types';
import type { ReactNode } from 'react';

interface Props {
  report: WrappedReport;
  tone: Tone;
}

// 카드 7~9 자리 — 디자인 핸드오프 받으면 실데이터로 교체
const PLACEHOLDER_TITLES: { num: number; title: string }[] = [
  { num: 7, title: 'Library' },
  { num: 8, title: 'Following' },
  { num: 9, title: '2027 Outlook' },
];

export default function WrappedView({ report, tone }: Props) {
  const userName = report.nickname ?? '사용자';
  const userAvatarUrl = report.avatar_url;

  // 기존 데이터에 time_range가 없으면 long_term으로 폴백 (마이그 전 생성된 행 호환)
  const timeRange = report.time_range ?? 'long_term';

  // 카드 4·5·6은 데이터가 null이면 placeholder로 폴백 (마이그 전 행 호환)
  const card4: ReactNode = report.top_loyalty ? (
    <Loyalty key="4" tone={tone} loyalty={report.top_loyalty} userName={userName} userAvatarUrl={userAvatarUrl} />
  ) : (
    <PlaceholderCard key="4" tone={tone} cardNumber={4} title="Artist Loyalty" userName={userName} userAvatarUrl={userAvatarUrl} />
  );

  const card5: ReactNode = report.top_album ? (
    <TopAlbum key="5" tone={tone} album={report.top_album} userName={userName} userAvatarUrl={userAvatarUrl} />
  ) : (
    <PlaceholderCard key="5" tone={tone} cardNumber={5} title="Top Album" userName={userName} userAvatarUrl={userAvatarUrl} />
  );

  const card6: ReactNode = report.taste_shift ? (
    <TasteShift key="6" tone={tone} shift={report.taste_shift} userName={userName} userAvatarUrl={userAvatarUrl} />
  ) : (
    <PlaceholderCard key="6" tone={tone} cardNumber={6} title="Taste Shift" userName={userName} userAvatarUrl={userAvatarUrl} />
  );

  const cards = [
    <TopArtists key="1" tone={tone} artists={report.top_artists} timeRange={timeRange} userName={userName} userAvatarUrl={userAvatarUrl} />,
    <TopTracks key="2" tone={tone} tracks={report.top_tracks} timeRange={timeRange} userName={userName} userAvatarUrl={userAvatarUrl} />,
    <TopGenres key="3" tone={tone} genres={report.top_genres} timeRange={timeRange} userName={userName} userAvatarUrl={userAvatarUrl} />,
    card4,
    card5,
    card6,
    ...PLACEHOLDER_TITLES.map((p) => (
      <PlaceholderCard
        key={p.num}
        tone={tone}
        cardNumber={p.num}
        title={p.title}
        userName={userName}
        userAvatarUrl={userAvatarUrl}
      />
    )),
  ];

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: tone.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px 40px',
        gap: 24,
      }}
    >
      <WrappedSlider tone={tone} cards={cards} />

      {/* CTA — 보는 사람이 본인 카드도 만들고 싶게 */}
      <a
        href="/auth/login"
        style={{
          marginTop: 8,
          padding: '12px 20px',
          borderRadius: 999,
          background: tone.fg,
          color: tone.bg,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'var(--font-pretendard)',
          letterSpacing: '-0.01em',
          textDecoration: 'none',
        }}
      >
        나도 내 취향 카드 만들기
      </a>
    </div>
  );
}
