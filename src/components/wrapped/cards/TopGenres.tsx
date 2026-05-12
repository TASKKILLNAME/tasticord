// Card 3 — Top Genres (CHART 템플릿 — 도넛)
// 디자인 핸드오프 cards-impact.jsx의 CardTopGenres를 React/TS로 이식
// 카드 mount 시 도넛이 시계방향으로 채워지는 entrance 애니메이션 (1.2s ease-out)
'use client';

import { useEffect, useState } from 'react';
import CardShell from '../CardShell';
import type { Tone } from '@/lib/wrapped/tones';
import { type WrappedGenre, type TimeRange, TIME_RANGE_LABELS } from '@/lib/wrapped/types';
import { COPY } from '@/lib/wrapped/copy';

interface Props {
  tone: Tone;
  genres: WrappedGenre[];
  timeRange: TimeRange;
  userName?: string;
  userHandle?: string;
  userAvatarUrl?: string | null;
}

const ANIM_DURATION_MS = 1200;

export default function TopGenres({ tone, genres, timeRange, userName, userHandle, userAvatarUrl }: Props) {
  const period = TIME_RANGE_LABELS[timeRange].ko;
  const copy = COPY[timeRange].genres;

  // 0 → 1 진행도 (애니메이션). mount 시 requestAnimationFrame 루프로 갱신
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / ANIM_DURATION_MS, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // 진행도에 맞춰 conic-gradient stop 위치를 스케일
  // 채워지지 않은 부분은 tone.chip 색으로 sweep 효과
  const stops: string[] = [];
  let acc = 0;
  genres.forEach((g) => {
    const sStart = acc * progress;
    const sEnd = (acc + g.pct) * progress;
    stops.push(`${g.color} ${sStart}% ${sEnd}%`);
    acc += g.pct;
  });

  let conic: string;
  if (stops.length === 0) {
    conic = `conic-gradient(from -90deg, ${tone.chip} 0% 100%)`;
  } else if (progress < 1) {
    conic = `conic-gradient(from -90deg, ${stops.join(', ')}, ${tone.chip} ${100 * progress}% 100%)`;
  } else {
    conic = `conic-gradient(from -90deg, ${stops.join(', ')})`;
  }

  const top = genres[0];
  const animatedTopPct = Math.round((top?.pct ?? 0) * progress);

  // 각 슬라이스 중심에 라벨 위치 계산
  // - 도넛 박스 240x240 → 중심 (120, 120), 외경 r=120, 내경 r=64 → 라벨 r=90 (ring 한가운데)
  // - conic-gradient는 `from -90deg` → 0%가 9시 위치에서 시작, 시계방향 진행
  // - conic 각도 θ를 화면 좌표로 변환: x = cx + r·sin(θ), y = cy − r·cos(θ)
  //   (θ=0이면 12시 = (cx, cy−r), θ=90이면 3시 = (cx+r, cy), θ=180이면 6시 = (cx, cy+r))
  // - 슬라이스 %가 5 미만이면 글자가 안 들어가 생략
  // - 라벨 페이드인은 해당 슬라이스가 채워지는 시점과 동기화
  const labelInfos = (() => {
    let acc = 0;
    return genres.map((g) => {
      const sliceStart = acc;
      const sliceMid = acc + g.pct / 2;
      acc += g.pct;
      const conicAngleDeg = sliceMid * 3.6 - 90;
      const conicAngleRad = (conicAngleDeg * Math.PI) / 180;
      const x = 120 + 90 * Math.sin(conicAngleRad);
      const y = 120 - 90 * Math.cos(conicAngleRad);
      const fadeStart = sliceStart / 100;
      const fadeMid = (sliceStart + g.pct / 2) / 100;
      // sliceMid를 지나는 시점에 완전히 보이도록 fade
      const opacity = Math.max(0, Math.min(1, (progress - fadeStart) / Math.max(0.01, fadeMid - fadeStart)));
      return { name: g.name, x, y, opacity, show: g.pct >= 5 };
    });
  })();

  return (
    <CardShell tone={tone} eyebrow={`최근 장르 · ${period}`} userName={userName} userHandle={userHandle} userAvatarUrl={userAvatarUrl}>
      {/* 헤드라인 */}
      <div style={{ padding: '28px 24px 0' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: tone.muted,
            letterSpacing: '0.16em',
            marginBottom: 10,
          }}
        >
          {copy.preHeadline}
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 0.95,
            color: tone.headline,
            letterSpacing: '-0.03em',
          }}
        >
          {top?.name ?? 'Music'}
        </h1>
      </div>

      {/* 도넛 차트 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: conic,
            position: 'relative',
            boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
          }}
        >
          {/* 슬라이스 안 라벨 — 너무 작은 슬라이스(10% 미만)는 생략 */}
          {labelInfos.map((info, idx) =>
            info.show ? (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: info.x,
                  top: info.y,
                  transform: 'translate(-50%, -50%)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#0A0A0F',
                  letterSpacing: '-0.01em',
                  textShadow: '0 1px 2px rgba(255,255,255,0.4)',
                  whiteSpace: 'nowrap',
                  opacity: info.opacity,
                  pointerEvents: 'none',
                }}
              >
                {info.name}
              </div>
            ) : null
          )}

          {/* 가운데 구멍 */}
          <div
            style={{
              position: 'absolute',
              inset: 56,
              borderRadius: '50%',
              background: tone.bg,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: tone.headline,
                lineHeight: 1,
                letterSpacing: '-0.04em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {animatedTopPct}%
            </div>
            <div
              style={{
                fontSize: 10,
                color: tone.muted,
                letterSpacing: '0.1em',
                marginTop: 4,
              }}
            >
              {top?.name?.toUpperCase() ?? ''}
            </div>
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div
        style={{
          padding: '0 24px 12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px 16px',
        }}
      >
        {genres.map((g) => (
          <div
            key={g.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: tone.fg,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: g.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                flex: 1,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {g.name}
            </span>
            <span
              style={{
                color: tone.muted,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {g.pct}%
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}
