// 게임 카드 3 — 누적 Top 5 (LIST 템플릿)
// RecentTopGames와 동일 구조, 데이터만 누적 기준
// 입장 애니메이션: 행이 위→아래 순서대로 슬라이드업+페이드인 (100ms 간격)
'use client';

import CardShell from '../../CardShell';
import ArtTile from '../../ArtTile';
import type { Tone } from '@/lib/wrapped/tones';
import type { AllTimeTopGame } from '@/lib/wrapped/game-types';
import { ARTIST_PALETTE } from '@/lib/wrapped/tones';
import { makeGameInitials } from '@/lib/wrapped/game-aggregate';

interface Props {
  tone: Tone;
  games: AllTimeTopGame[];
  userName?: string;
  userAvatarUrl?: string | null;
}

export default function AllTimeTopGames({ tone, games, userName, userAvatarUrl }: Props) {
  return (
    <CardShell tone={tone} eyebrow="ALL TIME · TOP 5" userName={userName} userAvatarUrl={userAvatarUrl} footerRight="POWERED BY STEAM">
      {/* 입장 keyframes — 컴포넌트 내부에 박아 globals.css 의존 제거 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes attg-row-in {
              from { opacity: 0; transform: translateY(20px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `,
        }}
      />
      <div style={{ padding: '28px 24px 18px' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: tone.muted,
            letterSpacing: '0.16em',
            marginBottom: 12,
          }}
        >
          역대 가장 깊게 빠진
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 45,
            fontWeight: 800,
            lineHeight: 0.92,
            color: tone.headline,
            letterSpacing: '-0.03em',
          }}
        >
          가장 많이
          <br />
          머물렀던
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {games.map((g, i) => (
          <div
            key={g.appid}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '8px 12px 8px 8px',
              borderRadius: 999,
              background: tone.chip,
              border: `1px solid ${tone.chipBorder}`,
              animation: `attg-row-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 100}ms both`,
            }}
          >
            <ArtTile
              color={ARTIST_PALETTE[i % ARTIST_PALETTE.length]}
              imageUrl={g.image_url}
              fallbackImageUrl={`/api/steam/image?appid=${g.appid}`}
              initials={makeGameInitials(g.name)}
              size={48}
              radius={12}
            />
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                lineHeight: 1,
                color: tone.accent,
                letterSpacing: '-0.02em',
                minWidth: 26,
              }}
            >
              {g.rank}
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 15,
                fontWeight: 600,
                color: tone.fg,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {g.name}
            </div>
            <div
              style={{
                fontSize: 12,
                color: tone.muted,
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}
            >
              {Math.round(g.playtime_hours)}시간
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 24px 4px' }}>
        <div style={{ fontSize: 12, color: tone.muted, lineHeight: 1.5 }}>
          이 게임들이 당신의 시간을 가장 많이 가져갔어요.
        </div>
      </div>
    </CardShell>
  );
}
