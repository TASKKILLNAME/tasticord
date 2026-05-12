// 게임 카드 2 — 최근 2주의 Obsession (큰 hero 이미지 + 큰 숫자)
// SINGLE FOCUS 템플릿 — 음악 TopAlbum과 유사하지만 가로형 게임 아트
// hero 이미지에 CRT 부팅 애니메이션 — 가로 라인이 펼쳐지며 화면 켜지는 효과
'use client';

import CardShell from '../../CardShell';
import { shade } from '../../shade';
import type { Tone } from '@/lib/wrapped/tones';
import type { WrappedRecentObsession } from '@/lib/wrapped/game-types';

interface Props {
  tone: Tone;
  obsession: WrappedRecentObsession;
  userName?: string;
  userAvatarUrl?: string | null;
}

export default function Obsession({ tone, obsession, userName, userAvatarUrl }: Props) {
  // header.jpg는 460x215 비율(약 2.14:1) → 카드 안에서 가로형 hero로 표현
  // 게임명은 상단 헤드라인에서 이미 보여주므로 이미지 위 오버레이는 제거 (가독성 그라데이션도 필요 없어짐)
  const heroBackground = obsession.image_url
    ? `url(${obsession.image_url}) center/cover`
    : `linear-gradient(135deg, ${tone.accent}, ${shade(tone.accent, -35)})`;

  return (
    <CardShell tone={tone} eyebrow="최근 2주" userName={userName} userAvatarUrl={userAvatarUrl} footerRight="POWERED BY STEAM">
      {/* CRT 부팅 효과 keyframes — 가로 라인 → 전체 펼침 + 밝기/채도 settle
          1. 0~10%:  중앙에 흰 가로선만 (scaleY 거의 0, brightness 6배, 채도 거의 0)
          2. 10~30%: 세로로 펼쳐짐 (scaleY 0→1, brightness 6→2.5, 채도 0→0.6)
          3. 30~60%: 밝기/채도 정상으로 settle
          4. 60~100%: 안정 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes obsession-crt-on {
              0%   { transform: scaleY(0.012); opacity: 0; filter: brightness(0) saturate(0); }
              10%  { transform: scaleY(0.012); opacity: 1; filter: brightness(6) saturate(0.2); }
              30%  { transform: scaleY(1); opacity: 1; filter: brightness(2.6) saturate(0.6); }
              55%  { transform: scaleY(1); opacity: 1; filter: brightness(1.3) saturate(0.95); }
              100% { transform: scaleY(1); opacity: 1; filter: brightness(1) saturate(1); }
            }
          `,
        }}
      />
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
          가장 많이 플레이한
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 30,
            fontWeight: 800,
            lineHeight: 0.95,
            color: tone.headline,
            letterSpacing: '-0.03em',
          }}
        >
          {obsession.name}
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 24px',
        }}
      >
        <div
          style={{
            width: '100%',
            aspectRatio: '460 / 215',
            borderRadius: 10,
            background: heroBackground,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            animation: 'obsession-crt-on 1.2s ease-out 0.15s both',
          }}
        />
      </div>

      <div
        style={{
          padding: '0 24px 14px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 12, color: tone.muted, maxWidth: 200, lineHeight: 1.45 }}>
          최근 2주 플레이타임 중
          <br />
          {obsession.pct_of_recent}%가 이 게임
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: tone.accent,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          {obsession.playtime_hours}
          <span style={{ fontSize: 18, fontWeight: 600, marginLeft: 4, letterSpacing: 0 }}>시간</span>
        </div>
      </div>
    </CardShell>
  );
}
