// 게임 카드 1 — 최근 2주 Top 5 (LIST 템플릿)
// 음악 TopArtists와 동일 패턴
// 입장 애니메이션: 행이 위→아래 순서대로 슬라이드업+페이드인 (100ms 간격)
'use client';

import CardShell from '../../CardShell';
import ArtTile from '../../ArtTile';
import type { Tone } from '@/lib/wrapped/tones';
import type { RecentTopGame } from '@/lib/wrapped/game-types';
import { ARTIST_PALETTE } from '@/lib/wrapped/tones';
import { makeGameInitials } from '@/lib/wrapped/game-aggregate';

interface Props {
  tone: Tone;
  games: RecentTopGame[];
  userName?: string;
  userAvatarUrl?: string | null;
}

export default function RecentTopGames({ tone, games, userName, userAvatarUrl }: Props) {
  return (
    <CardShell tone={tone} eyebrow="최근 2주" userName={userName} userAvatarUrl={userAvatarUrl} footerRight="POWERED BY STEAM">
      {/* 입장 keyframes — 컴포넌트 내부에 박아 globals.css 의존 제거 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes rtg-row-in {
              from { opacity: 0; transform: translateY(20px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `,
        }}
      />

      <div style={{ padding: '28px 24px 18px' }}>
        <h1
          style={{
            margin: 0,
            fontSize: 33,
            fontWeight: 800,
            lineHeight: 1.05,
            color: tone.headline,
            letterSpacing: '-0.03em',
          }}
        >
          요즘 가장 빠진
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
        {games.map((g, i) => {
          // 입장 stagger: 행마다 100ms씩 늦춤. 'both' fill mode로 delay 동안 첫 키프레임 상태 유지
          const entranceAnim = `rtg-row-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 100}ms both`;

          const rowStyle: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '8px 12px 8px 8px',
            borderRadius: 999,
            background: tone.chip,
            border: `1px solid ${tone.chipBorder}`,
            animation: entranceAnim,
          };

          return (
            <div key={g.appid} style={rowStyle}>
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
                {g.playtime_hours}시간
              </div>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}
