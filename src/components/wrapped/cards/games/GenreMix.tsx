// 게임 카드 4 — 장르 도넛 (CHART 템플릿)
// 음악 TopGenres와 동일 패턴 — 플레이타임 기반 장르 비율
// 카드 mount 시 도넛이 시계방향으로 채워지는 entrance 애니메이션 (1.2s ease-out)
'use client';

import { useEffect, useState } from 'react';
import CardShell from '../../CardShell';
import type { Tone } from '@/lib/wrapped/tones';
import type { WrappedGameGenre } from '@/lib/wrapped/game-types';

interface Props {
  tone: Tone;
  genres: WrappedGameGenre[];
  userName?: string;
  userAvatarUrl?: string | null;
}

const ANIM_DURATION_MS = 1200;

export default function GenreMix({ tone, genres, userName, userAvatarUrl }: Props) {
  // 0 → 1 진행도 (애니메이션). mount 시 requestAnimationFrame 루프로 갱신
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const t = Math.min((now - start) / ANIM_DURATION_MS, 1);
      // ease-out cubic — 끝에서 부드럽게 감속
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // 진행도에 맞춰 conic-gradient stop 위치를 스케일
  // 채워지지 않은 부분은 tone.chip 색으로 채워서 "비어있는 도넛" 느낌
  const stops: string[] = [];
  let acc = 0;
  genres.forEach((g) => {
    const start = acc * progress;
    const end = (acc + g.pct) * progress;
    stops.push(`${g.color} ${start}% ${end}%`);
    acc += g.pct;
  });

  let conic: string;
  if (stops.length === 0) {
    conic = `conic-gradient(from -90deg, ${tone.chip} 0% 100%)`;
  } else if (progress < 1) {
    // 아직 다 채워지지 않은 영역은 chip 색으로 (sweep 효과)
    conic = `conic-gradient(from -90deg, ${stops.join(', ')}, ${tone.chip} ${100 * progress}% 100%)`;
  } else {
    conic = `conic-gradient(from -90deg, ${stops.join(', ')})`;
  }

  const top = genres[0];
  // 가운데 % 숫자도 진행도와 함께 카운트업
  const animatedTopPct = Math.round((top?.pct ?? 0) * progress);

  // 각 슬라이스 중심에 라벨 위치 계산
  // - 도넛 박스 240x240 → 중심 (120, 120), 외경 r=120, 내경 r=64 → 라벨 r=90 (ring 한가운데)
  // - conic-gradient는 `from -90deg` → 0%가 9시 위치에서 시작, 시계방향 진행
  // - conic 각도 θ를 화면 좌표로 변환: x = cx + r·sin(θ), y = cy − r·cos(θ)
  // - 슬라이스 %가 5 미만이면 글자가 안 들어가 생략
  // - 라벨 페이드인은 해당 슬라이스가 채워지는 시점과 동기화
  const labelInfos = (() => {
    let cursor = 0;
    return genres.map((g) => {
      const sliceStart = cursor;
      const sliceMid = cursor + g.pct / 2;
      cursor += g.pct;
      const conicAngleDeg = sliceMid * 3.6 - 90;
      const conicAngleRad = (conicAngleDeg * Math.PI) / 180;
      const x = 120 + 90 * Math.sin(conicAngleRad);
      const y = 120 - 90 * Math.cos(conicAngleRad);
      const fadeStart = sliceStart / 100;
      const fadeMid = (sliceStart + g.pct / 2) / 100;
      const opacity = Math.max(0, Math.min(1, (progress - fadeStart) / Math.max(0.01, fadeMid - fadeStart)));
      return { name: g.name, x, y, opacity, show: g.pct >= 5 };
    });
  })();

  return (
    <CardShell tone={tone} eyebrow="역대 취향 분석" userName={userName} userAvatarUrl={userAvatarUrl} footerRight="POWERED BY STEAM">
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
          당신이 가장 자주 잠긴 세계
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
          {top?.name ?? 'Games'}
        </h1>
      </div>

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
                maxWidth: 100,
                textAlign: 'center',
              }}
            >
              {top?.name?.toUpperCase() ?? ''}
            </div>
          </div>
        </div>
      </div>

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
