// 게임 카드 2 — 최근 2주의 Obsession (큰 hero 이미지 + 큰 숫자)
// SINGLE FOCUS 템플릿 — 음악 TopAlbum과 유사하지만 가로형 게임 아트
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
