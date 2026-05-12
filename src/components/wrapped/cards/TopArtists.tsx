// Card 1 — Top 5 Artists (LIST 템플릿)
// 디자인 핸드오프 cards-impact.jsx의 CardTopArtists를 React/TS로 이식
// 입장 애니메이션: 행이 위→아래 순서대로 슬라이드업+페이드인 (100ms 간격)
'use client';

import CardShell from '../CardShell';
import ArtTile from '../ArtTile';
import type { Tone } from '@/lib/wrapped/tones';
import { type WrappedArtist, type TimeRange, TIME_RANGE_LABELS } from '@/lib/wrapped/types';
import { COPY } from '@/lib/wrapped/copy';

interface Props {
  tone: Tone;
  artists: WrappedArtist[];
  timeRange: TimeRange;
  userName?: string;
  userHandle?: string;
  userAvatarUrl?: string | null;
}

export default function TopArtists({ tone, artists, timeRange, userName, userHandle, userAvatarUrl }: Props) {
  const period = TIME_RANGE_LABELS[timeRange].ko;
  const copy = COPY[timeRange].artists;
  return (
    <CardShell tone={tone} eyebrow={`TOP ARTISTS · ${period}`} userName={userName} userHandle={userHandle} userAvatarUrl={userAvatarUrl}>
      {/* 입장 keyframes — 컴포넌트 내부에 박아 globals.css 의존 제거 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes ta-row-in {
              from { opacity: 0; transform: translateY(20px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `,
        }}
      />
      {/* 헤드라인 */}
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
          {copy.preHeadline}
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 0.92,
            color: tone.headline,
            letterSpacing: '-0.03em',
          }}
        >
          Top 5
          <br />

        </h1>
      </div>

      {/* 리스트 */}
      <div
        style={{
          flex: 1,
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {artists.map((a, i) => (
          <div
            key={a.rank}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '8px 12px 8px 8px',
              borderRadius: 999,
              background: tone.chip,
              border: `1px solid ${tone.chipBorder}`,
              animation: `ta-row-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 100}ms both`,
            }}
          >
            <ArtTile
              color={a.color}
              initials={a.initials}
              imageUrl={a.imageUrl}
              size={48}
              radius={999}
              ink={a.color === '#1C1C1E' ? '#FFF' : tone.accentInk}
            />
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                lineHeight: 1,
                color: tone.accent,
                letterSpacing: '-0.02em',
                minWidth: 28,
              }}
            >
              {a.rank}
            </div>
            <div
              style={{
                flex: 1,
                fontSize: 17,
                fontWeight: 600,
                color: tone.fg,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {a.name}
            </div>
          </div>
        ))}
      </div>

      {/* 카피 */}
      <div style={{ padding: '16px 24px 4px' }}>
        <div style={{ fontSize: 12, color: tone.muted, lineHeight: 1.5 }}>
          {copy.tagline}
        </div>
      </div>
    </CardShell>
  );
}
