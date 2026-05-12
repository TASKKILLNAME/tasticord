// 카드 5 — Devoted Fan (Artist Loyalty)
// 디자인 핸드오프 cards-tier1b.jsx의 CardLoyalty를 React/TS로 이식
// 아티스트 사진 주변 펄스 링 + "#1" 배지로 1등 강조
'use client';

import CardShell from '../CardShell';
import ArtTile from '../ArtTile';
import type { Tone } from '@/lib/wrapped/tones';
import { type WrappedLoyalty, type TimeRange, TIME_RANGE_LABELS } from '@/lib/wrapped/types';

interface Props {
  tone: Tone;
  loyalty: WrappedLoyalty;
  timeRange: TimeRange;
  userName?: string;
  userHandle?: string;
  userAvatarUrl?: string | null;
}

export default function Loyalty({ tone, loyalty, timeRange, userName, userHandle, userAvatarUrl }: Props) {
  const period = TIME_RANGE_LABELS[timeRange].ko;

  return (
    <CardShell tone={tone} eyebrow={`Top artist · ${period}`} userName={userName} userHandle={userHandle} userAvatarUrl={userAvatarUrl}>
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
          최근 가장 많이 들은 아티스트
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1,
            color: tone.headline,
            letterSpacing: '-0.03em',
          }}
        >
          Top
          <br />
          artist
        </h1>
      </div>

      {/* 1등 강조 애니메이션 keyframes — 컴포넌트 내부에 박아 globals.css 의존 제거
          pulse: 펄스 링이 원본 크기→1.5배로 확장하며 페이드아웃
          badge-pop: 카드 진입 시 #1 배지가 작게 시작해서 통통 튀어나옴 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes loyalty-pulse {
              0%   { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
              100% { transform: translate(-50%, -50%) scale(1.55); opacity: 0; }
            }
            @keyframes loyalty-badge-pop {
              0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
              60%  { transform: scale(1.2) rotate(8deg); opacity: 1; }
              80%  { transform: scale(0.95) rotate(-4deg); }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
          `,
        }}
      />

      {/* 큰 원형 아트 + 아티스트명 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        {/* ArtTile 주위에 펄스 링 + #1 배지 */}
        <div style={{ position: 'relative', width: 170, height: 170 }}>
          {/* 펄스 링 3개 — 0/1/2초 지연으로 연속 파동.
              지연 동안 보이지 않게 inline opacity: 0 + 중앙 정렬 transform 명시 */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 170,
                height: 170,
                borderRadius: '50%',
                border: `2px solid ${tone.accent}`,
                transform: 'translate(-50%, -50%)',
                opacity: 0,
                animation: `loyalty-pulse 3s ease-out ${i}s infinite`,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          ))}
          {/* 아티스트 사진 (펄스 위에) */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <ArtTile
              color={loyalty.artist_color}
              initials={loyalty.artist_initials}
              imageUrl={loyalty.artist_image_url}
              size={170}
              radius={999}
              ink="#0A0A0F"
            />
          </div>
          {/* "#1" 배지 — 사진 우상단에 통통 튀어나옴 */}
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: tone.accent,
              color: tone.accentInk,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 800,
              fontStyle: 'italic',
              letterSpacing: '-0.04em',
              boxShadow: `0 4px 14px ${tone.accent}66`,
              border: `2px solid ${tone.bg}`,
              animation: 'loyalty-badge-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both',
              zIndex: 2,
            }}
          >
            #1
          </div>
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: tone.headline,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          {loyalty.artist_name}
        </div>
      </div>

      {/* 좌: 설명 / 우: 큰 숫자 */}
      <div
        style={{
          padding: '0 24px 14px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 12, color: tone.muted, maxWidth: 180, lineHeight: 1.45 }}>
          Top 50곡 중
          <br />
          {loyalty.count}곡이 이 아티스트
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            color: tone.accent,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {loyalty.count}
          <span style={{ fontSize: 18, fontWeight: 600, marginLeft: 4, letterSpacing: 0 }}>
            /50
          </span>
        </div>
      </div>
    </CardShell>
  );
}
