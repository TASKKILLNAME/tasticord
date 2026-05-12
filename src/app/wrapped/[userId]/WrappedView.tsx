// 공유 페이지 클라이언트 뷰
// 커버 + 실데이터 6장 = 총 7장
// 친구 비교 카드(Discovery/Friend Match/Common Ground)는 취향 카드 범위에서 제외
'use client';

import WrappedSlider from '@/components/wrapped/WrappedSlider';
import CoverCard from '@/components/wrapped/cards/CoverCard';
import ClosingCard from '@/components/wrapped/cards/ClosingCard';
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

export default function WrappedView({ report, tone }: Props) {
  const userName = report.nickname ?? '사용자';
  const userAvatarUrl = report.avatar_url;

  // 기존 데이터에 time_range가 없으면 long_term으로 폴백 (마이그 전 생성된 행 호환)
  const timeRange = report.time_range ?? 'long_term';

  // 데이터가 null이면 placeholder로 폴백 (마이그 전 행 호환)
  const cardTasteShift: ReactNode = report.taste_shift ? (
    <TasteShift key="taste-shift" tone={tone} shift={report.taste_shift} userName={userName} userAvatarUrl={userAvatarUrl} />
  ) : (
    <PlaceholderCard key="taste-shift" tone={tone} cardNumber={5} title="Taste Shift" userName={userName} userAvatarUrl={userAvatarUrl} />
  );

  const cardLoyalty: ReactNode = report.top_loyalty ? (
    <Loyalty key="loyalty" tone={tone} loyalty={report.top_loyalty} timeRange={timeRange} userName={userName} userAvatarUrl={userAvatarUrl} />
  ) : (
    <PlaceholderCard key="loyalty" tone={tone} cardNumber={6} title="Artist Loyalty" userName={userName} userAvatarUrl={userAvatarUrl} />
  );

  const cardTopAlbum: ReactNode = report.top_album ? (
    <TopAlbum key="top-album" tone={tone} album={report.top_album} timeRange={timeRange} userName={userName} userAvatarUrl={userAvatarUrl} />
  ) : (
    <PlaceholderCard key="top-album" tone={tone} cardNumber={7} title="Top Album" userName={userName} userAvatarUrl={userAvatarUrl} />
  );

  const cards = [
    <CoverCard key="0" tone={tone} type="music" userName={userName} userAvatarUrl={userAvatarUrl} />,
    <TopArtists key="1" tone={tone} artists={report.top_artists} timeRange={timeRange} userName={userName} userAvatarUrl={userAvatarUrl} />,
    <TopTracks key="2" tone={tone} tracks={report.top_tracks} timeRange={timeRange} userName={userName} userAvatarUrl={userAvatarUrl} />,
    <TopGenres key="3" tone={tone} genres={report.top_genres} timeRange={timeRange} userName={userName} userAvatarUrl={userAvatarUrl} />,
    cardTasteShift, // 5
    cardLoyalty,    // 6
    cardTopAlbum,   // 7
    <ClosingCard key="closing" tone={tone} type="music" userName={userName} userAvatarUrl={userAvatarUrl} />, // 8 — 마무리
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
    </div>
  );
}
