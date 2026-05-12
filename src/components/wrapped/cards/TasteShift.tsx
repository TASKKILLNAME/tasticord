// 카드 7 — Then vs Now (Taste Shift) — COMPARE 템플릿
// 디자인 핸드오프 cards-tier2.jsx의 CardTasteShift를 React/TS로 이식
// "↑ 새로 빠진" 라벨의 화살표를 연속 상승 애니메이션으로 강조
'use client';

import type { ReactNode } from 'react';
import CardShell from '../CardShell';
import ArtTile from '../ArtTile';
import type { Tone } from '@/lib/wrapped/tones';
import type { WrappedTasteShift } from '@/lib/wrapped/types';

interface Props {
  tone: Tone;
  shift: WrappedTasteShift;
  userName?: string;
  userHandle?: string;
  userAvatarUrl?: string | null;
}

// 연속 상승 화살표 — 두 개의 화살표가 0.8초 간격으로 이어서 위로 올라감 (끊김 없는 흐름)
function RisingArrow({ color }: { color: string }) {
  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    color,
    fontWeight: 700,
    lineHeight: 1,
  };
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        width: 10,
        height: 14,
        marginRight: 4,
        verticalAlign: 'middle',
      }}
    >
      <span style={{ ...arrowStyle, animation: 'taste-shift-rise 1.6s ease-out infinite' }}>↑</span>
      <span style={{ ...arrowStyle, animation: 'taste-shift-rise 1.6s ease-out 0.8s infinite' }}>↑</span>
    </span>
  );
}

// 한 블록(↑ 새로 빠진 / ∞ 변함없는)의 공통 구조
function CompareBlock({
  tone,
  label,
  labelColor,
  artist,
  sub,
}: {
  tone: Tone;
  label: ReactNode;
  labelColor: string;
  artist: WrappedTasteShift['new_love'];
  sub: string;
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        background: tone.chip,
        border: `1px solid ${tone.chipBorder}`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: labelColor,
          letterSpacing: '0.14em',
          fontWeight: 700,
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <ArtTile
          color={artist.color}
          initials={artist.initials}
          imageUrl={artist.image_url}
          size={56}
          radius={999}
          ink="#0A0A0F"
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 28,
              color: tone.headline,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {artist.name}
          </div>
          <div style={{ fontSize: 11, color: tone.muted, marginTop: 6 }}>{sub}</div>
        </div>
      </div>
    </div>
  );
}

export default function TasteShift({ tone, shift, userName, userHandle, userAvatarUrl }: Props) {
  return (
    <CardShell
      tone={tone}
      eyebrow="THEN VS NOW"
      userName={userName}
      userHandle={userHandle}
      userAvatarUrl={userAvatarUrl}
    >
      {/* 상승 화살표 keyframes — 컴포넌트 내부에 박아 globals.css 의존 제거
          rise: 라벨 옆 연속 상승 (infinite)
          burst: 카드 마운트 시 일회성 솟구침 (forwards) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes taste-shift-rise {
              0%   { transform: translateY(6px); opacity: 0; }
              25%  { transform: translateY(0); opacity: 1; }
              75%  { transform: translateY(-10px); opacity: 0.5; }
              100% { transform: translateY(-18px); opacity: 0; }
            }
            @keyframes taste-shift-burst {
              0%   { transform: translateY(24px) scale(0.4); opacity: 0; }
              20%  { transform: translateY(8px) scale(1); opacity: 1; }
              100% { transform: translateY(-80px) scale(1); opacity: 0; }
            }
          `,
        }}
      />


      {/* 헤드라인 */}
      <div style={{ padding: '24px 24px 0' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: tone.muted,
            letterSpacing: '0.16em',
            marginBottom: 10,
          }}
        >
          최근 4주 vs 꾸준한 취향
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 0.95,
            color: tone.headline,
            letterSpacing: '-0.03em',
          }}
        >
          Then &
          <br />
          Now
        </h1>
      </div>

      {/* 2단 비교 블록 — 위쪽으로 살짝 당겨 헤드라인과 가깝게 */}
      <div
        style={{
          flex: 1,
          padding: '20px 20px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          justifyContent: 'flex-start',
        }}
      >
        {/* 새로 빠진 블록 + 블록 내부에 일회성 burst 화살표 */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16 }}>
          <CompareBlock
            tone={tone}
            label={
              <>
                <RisingArrow color={tone.accent} />
                새로 빠진
              </>
            }
            labelColor={tone.accent}
            artist={shift.new_love}
            sub="최근 차트에 새로 등장"
          />
          {/* 블록 내부에 흩어진 화살표 8개 — 진입 시 일제히 솟구침 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {[
              { x: 30, y: 8, delay: 0 },
              { x: 100, y: 4, delay: 80 },
              { x: 180, y: 12, delay: 40 },
              { x: 250, y: 6, delay: 160 },
              { x: 290, y: 14, delay: 120 },
              { x: 60, y: 88, delay: 200 },
              { x: 160, y: 92, delay: 100 },
              { x: 260, y: 90, delay: 240 },
            ].map((p, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  left: p.x,
                  top: p.y,
                  color: tone.accent,
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: 1,
                  opacity: 0,
                  animation: `taste-shift-burst 1.4s ease-out ${p.delay}ms forwards`,
                  textShadow: `0 0 8px ${tone.accent}80`,
                }}
              >
                ↑
              </span>
            ))}
          </div>
        </div>
        <CompareBlock
          tone={tone}
          label="∞ 변함없는"
          labelColor={tone.muted}
          artist={shift.constant}
          sub="최다 청취 아티스트"
        />
      </div>
    </CardShell>
  );
}
