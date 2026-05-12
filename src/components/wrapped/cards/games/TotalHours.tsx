// 게임 카드 5 — 누적 시간 (SINGLE BIG NUMBER)
// 핵심: 큰 시간 숫자 + 일 환산 카피
// 카드 진입 시 숫자(총 시간/일수/최저시급) 카운트업 애니메이션
'use client';

import { useEffect, useState } from 'react';
import CardShell from '../../CardShell';
import type { Tone } from '@/lib/wrapped/tones';
import type { WrappedTotalHours } from '@/lib/wrapped/game-types';

interface Props {
  tone: Tone;
  data: WrappedTotalHours;
  userName?: string;
  userAvatarUrl?: string | null;
}

// 한국 최저시급 (2025년 기준 — 매년 갱신 필요)
const MIN_WAGE_KRW = 10320;

// 카드 가운데 들어가는 아날로그 시계 (시침/분침/초침 회전)
function AnalogClock({
  size,
  faceColor,
  handColor,
  accentColor,
}: {
  size: number;
  faceColor: string;
  handColor: string;
  accentColor: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  // 시계 12개 눈금
  const ticks = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const inner = i % 3 === 0 ? r - 8 : r - 5;
    return {
      x1: cx + inner * Math.cos(angle),
      y1: cy + inner * Math.sin(angle),
      x2: cx + r * Math.cos(angle),
      y2: cy + r * Math.sin(angle),
      strong: i % 3 === 0,
    };
  });

  // SVG element는 transform-box 기본값(view-box) 그대로 두고 SVG 좌표계 기준으로 회전 중심 지정
  const handStyleBase: React.CSSProperties = {
    transformOrigin: `${cx}px ${cy}px`,
  };

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes tasticord-clock-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `,
        }}
      />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 시계 테두리 */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={faceColor} strokeWidth={1.5} />
        {/* 눈금 */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={faceColor}
            strokeWidth={t.strong ? 2 : 1}
            strokeLinecap="round"
          />
        ))}
        {/* 시침 — 90s/회전 (가장 짧고 굵게) */}
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - r * 0.5}
          stroke={handColor}
          strokeWidth={3}
          strokeLinecap="round"
          style={{ ...handStyleBase, animation: 'tasticord-clock-spin 90s linear infinite' }}
        />
        {/* 분침 — 15s/회전 */}
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - r * 0.75}
          stroke={handColor}
          strokeWidth={2}
          strokeLinecap="round"
          style={{ ...handStyleBase, animation: 'tasticord-clock-spin 15s linear infinite' }}
        />
        {/* 초침 — 3s/회전 (가장 길고 얇게, accent 색) */}
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - r * 0.9}
          stroke={accentColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          style={{ ...handStyleBase, animation: 'tasticord-clock-spin 3s linear infinite' }}
        />
        {/* 중심점 */}
        <circle cx={cx} cy={cy} r={3} fill={accentColor} />
      </svg>
    </div>
  );
}

const COUNT_UP_MS = 1400;

export default function TotalHours({ tone, data, userName, userAvatarUrl }: Props) {
  // 자릿수에 따라 폰트 자동 조정 — "시간" 접미사까지 한 줄에 들어가도록 보수적으로
  const digits = String(data.total_hours).length;
  const fontSize = digits >= 5 ? 80 : digits >= 4 ? 108 : 140;

  const earnings = data.total_hours * MIN_WAGE_KRW;

  // 카드 진입 시 숫자가 0→실제값으로 카운트업 (ease-out cubic, 1.4s)
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / COUNT_UP_MS, 1);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const animatedHours = Math.round(data.total_hours * progress);
  const animatedDays = Math.round(data.total_days * progress);
  const animatedEarnings = Math.round(earnings * progress);

  return (
    <CardShell tone={tone} eyebrow="TOTAL PLAYTIME" userName={userName} userAvatarUrl={userAvatarUrl} footerRight="POWERED BY STEAM">
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

        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 0.95,
            color: tone.headline,
            letterSpacing: '-0.03em',
          }}
        >
          당신이 게임에 쏟은 시간
          <br />

        </h1>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize,
              fontWeight: 800,
              lineHeight: 0.85,
              color: tone.accent,
              letterSpacing: '-0.05em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {animatedHours.toLocaleString()}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: tone.accent,
              letterSpacing: '-0.02em',
            }}
          >
            시간
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: tone.muted,
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            쉬지 않고 플레이하면 약 <span style={{ color: tone.headline, fontWeight: 700 }}>{animatedDays}일</span>
          </div>
          <div
            style={{
              fontSize: 14,
              color: tone.muted,
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            최저시급으로는 <span style={{ color: tone.headline, fontWeight: 700 }}>₩{animatedEarnings.toLocaleString('ko-KR')}</span>
          </div>
        </div>

        {/* 최저시급 텍스트 아래에 회전하는 아날로그 시계 */}
        <AnalogClock
          size={110}
          faceColor={tone.faint}
          handColor={tone.fg}
          accentColor={tone.accent}
        />
      </div>

      <div style={{ padding: '14px 24px 14px' }}>
        <div style={{ fontSize: 12, color: tone.muted, lineHeight: 1.5, textAlign: 'center' }}>
          이만큼이 당신과 함께한 가상 세계의 시간.
        </div>
      </div>
    </CardShell>
  );
}
