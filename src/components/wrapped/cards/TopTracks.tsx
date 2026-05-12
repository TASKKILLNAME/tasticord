// Card 2 — Top 5 Tracks (LIST 템플릿)
// 코드는 미포함, README 스펙 기반으로 신규 작성
// Card 1과 같은 List 템플릿이지만 둥근 사각 아트 + 트랙명/아티스트 두 줄
// 입장 애니메이션: 행이 위→아래 순서대로 슬라이드업+페이드인 (100ms 간격)
'use client';

import CardShell from '../CardShell';
import ArtTile from '../ArtTile';
import type { Tone } from '@/lib/wrapped/tones';
import { type WrappedTrack, type TimeRange, TIME_RANGE_LABELS } from '@/lib/wrapped/types';
import { COPY } from '@/lib/wrapped/copy';

interface Props {
  tone: Tone;
  tracks: WrappedTrack[];
  timeRange: TimeRange;
  userName?: string;
  userHandle?: string;
  userAvatarUrl?: string | null;
}

export default function TopTracks({ tone, tracks, timeRange, userName, userHandle, userAvatarUrl }: Props) {
  const period = TIME_RANGE_LABELS[timeRange].ko;
  const copy = COPY[timeRange].tracks;
  return (
    <CardShell tone={tone} eyebrow={`TOP TRACKS · ${period}`} userName={userName} userHandle={userHandle} userAvatarUrl={userAvatarUrl}>
      {/* 입장 keyframes — 컴포넌트 내부에 박아 globals.css 의존 제거 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes tt-row-in {
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
            fontSize: 44,
            fontWeight: 800,
            lineHeight: 0.92,
            color: tone.headline,
            letterSpacing: '-0.03em',
          }}
        >
          상위 5곡
          <br />
        </h1>
      </div>

      {/* 리스트 (둥근 사각, pill 아님) */}
      <div
        style={{
          flex: 1,
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {tracks.map((t, i) => (
          <div
            key={t.rank}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '8px 12px',
              borderRadius: 12,
              background: tone.chip,
              border: `1px solid ${tone.chipBorder}`,
              animation: `tt-row-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 100}ms both`,
            }}
          >
            <ArtTile
              color={t.color}
              initials={t.name.slice(0, 2).toUpperCase()}
              imageUrl={t.imageUrl}
              size={56}
              radius={6}
              ink={t.color === '#1C1C1E' ? '#FFF' : tone.accentInk}
            />
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                lineHeight: 1,
                color: tone.accent,
                letterSpacing: '-0.02em',
                minWidth: 24,
              }}
            >
              {t.rank}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: tone.fg,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: tone.muted,
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t.artist}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 24px 4px' }}>
        <div style={{ fontSize: 12, color: tone.muted, lineHeight: 1.5 }}>
          {copy.tagline}
        </div>
      </div>
    </CardShell>
  );
}
