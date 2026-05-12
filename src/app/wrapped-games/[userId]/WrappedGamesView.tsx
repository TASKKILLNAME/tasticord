// 공유 페이지 클라이언트 뷰 — 게임 카드 6장
// 흐름: 최근(1~2) → 누적(3~6)
'use client';

import WrappedSlider from '@/components/wrapped/WrappedSlider';
import CoverCard from '@/components/wrapped/cards/CoverCard';
import ClosingCard from '@/components/wrapped/cards/ClosingCard';
import RecentTopGames from '@/components/wrapped/cards/games/RecentTopGames';
import Obsession from '@/components/wrapped/cards/games/Obsession';
import AllTimeTopGames from '@/components/wrapped/cards/games/AllTimeTopGames';
import GenreMix from '@/components/wrapped/cards/games/GenreMix';
import TotalHours from '@/components/wrapped/cards/games/TotalHours';
import Library from '@/components/wrapped/cards/games/Library';
import PlaceholderCard from '@/components/wrapped/cards/PlaceholderCard';
import type { Tone } from '@/lib/wrapped/tones';
import type { WrappedGamesReport } from '@/lib/wrapped/game-types';
import type { ReactNode } from 'react';

interface Props {
  report: WrappedGamesReport;
  tone: Tone;
}

export default function WrappedGamesView({ report, tone }: Props) {
  const userName = report.nickname ?? '플레이어';
  const userAvatarUrl = report.avatar_url;

  // 데이터가 없으면 placeholder로 폴백 (Steam 데이터 부족·프로필 비공개 케이스 대비)
  const card1: ReactNode =
    report.recent_top_games.length > 0 ? (
      <RecentTopGames key="1" tone={tone} games={report.recent_top_games} userName={userName} userAvatarUrl={userAvatarUrl} />
    ) : (
      <PlaceholderCard
        key="1"
        tone={tone}
        cardNumber={1}
        title="Last 2 Weeks"
        userName={userName}
        userAvatarUrl={userAvatarUrl}
        footerRight="POWERED BY STEAM"
      />
    );

  const card2: ReactNode = report.recent_obsession ? (
    <Obsession key="2" tone={tone} obsession={report.recent_obsession} userName={userName} userAvatarUrl={userAvatarUrl} />
  ) : (
    <PlaceholderCard key="2" tone={tone} cardNumber={2} title="The Obsession" userName={userName} userAvatarUrl={userAvatarUrl} footerRight="POWERED BY STEAM" />
  );

  const card3: ReactNode =
    report.all_time_top_games.length > 0 ? (
      <AllTimeTopGames
        key="3"
        tone={tone}
        games={report.all_time_top_games}
        userName={userName}
        userAvatarUrl={userAvatarUrl}
      />
    ) : (
      <PlaceholderCard
        key="3"
        tone={tone}
        cardNumber={3}
        title="All Time Top"
        userName={userName}
        userAvatarUrl={userAvatarUrl}
        footerRight="POWERED BY STEAM"
      />
    );

  const card4: ReactNode =
    report.genre_mix.length > 0 ? (
      <GenreMix key="4" tone={tone} genres={report.genre_mix} userName={userName} userAvatarUrl={userAvatarUrl} />
    ) : (
      <PlaceholderCard
        key="4"
        tone={tone}
        cardNumber={4}
        title="Genre Mix"
        userName={userName}
        userAvatarUrl={userAvatarUrl}
        footerRight="POWERED BY STEAM"
      />
    );

  const card5: ReactNode = report.total_hours ? (
    <TotalHours key="5" tone={tone} data={report.total_hours} userName={userName} userAvatarUrl={userAvatarUrl} />
  ) : (
    <PlaceholderCard
      key="5"
      tone={tone}
      cardNumber={5}
      title="Total Hours"
      userName={userName}
      userAvatarUrl={userAvatarUrl}
      footerRight="POWERED BY STEAM"
    />
  );

  const card6: ReactNode = report.library_stats ? (
    <Library
      key="6"
      tone={tone}
      data={report.library_stats}
      gameImages={report.all_time_top_games.map((g) => g.image_url)}
      userName={userName}
      userAvatarUrl={userAvatarUrl}
    />
  ) : (
    <PlaceholderCard
      key="6"
      tone={tone}
      cardNumber={6}
      title="The Library"
      userName={userName}
      userAvatarUrl={userAvatarUrl}
      footerRight="POWERED BY STEAM"
    />
  );

  const cover = (
    <CoverCard key="0" tone={tone} type="game" userName={userName} userAvatarUrl={userAvatarUrl} />
  );

  const closing = (
    <ClosingCard key="closing" tone={tone} type="game" userName={userName} userAvatarUrl={userAvatarUrl} />
  );

  // 2번(RecentTopGames)과 3번(Obsession) 순서 교체 — Obsession을 먼저 보여주고 리스트는 뒤로
  const cards = [cover, card2, card1, card3, card4, card5, card6, closing];

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
