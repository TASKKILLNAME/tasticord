// 게임 카드 7 — Library + Backlog
// 보유 / 플레이 / 미플레이 수를 동시에 보여줌. Backlog 비율이 핵심 임팩트.
import CardShell from '../../CardShell';
import type { Tone } from '@/lib/wrapped/tones';
import type { WrappedLibraryStats } from '@/lib/wrapped/game-types';

interface Props {
  tone: Tone;
  data: WrappedLibraryStats;
  gameImages?: string[]; // 마퀴용 — 누적 Top 게임 이미지 URL 리스트
  userName?: string;
  userAvatarUrl?: string | null;
}

export default function Library({ tone, data, gameImages, userName, userAvatarUrl }: Props) {
  // 무한 루프를 위해 이미지 리스트 2벌 (-50% 이동 시 시작점과 동일 → 끊김 없음)
  const marqueeImages = gameImages && gameImages.length > 0 ? [...gameImages, ...gameImages] : [];

  return (
    <CardShell tone={tone} eyebrow="소유한 게임" userName={userName} userAvatarUrl={userAvatarUrl} footerRight="POWERED BY STEAM">
      {/* 마퀴 keyframes — 컴포넌트 내부에 직접 박아서 globals.css 의존 제거 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes tasticord-library-marquee {
              0% { transform: translate3d(0, 0, 0); }
              100% { transform: translate3d(-50%, 0, 0); }
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
          당신의 게임 라이브러리
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
          당신이
          <br />
          소유한
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        {/* 게임 이미지 마퀴 — 좌→우 자동 슬라이딩, 가장자리 fade out */}
        {marqueeImages.length > 0 && (
          <div
            style={{
              width: '100%',
              overflow: 'hidden',
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
              maskImage:
                'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 10,
                width: 'max-content',
                animation: 'tasticord-library-marquee 24s linear infinite',
              }}
            >
              {marqueeImages.map((url, i) => (
                <div
                  key={i}
                  style={{
                    width: 96,
                    height: 45, // Steam header.jpg 2.14:1 비율
                    flexShrink: 0,
                    borderRadius: 6,
                    backgroundImage: `url(${url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 보유 게임 큰 숫자 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            padding: '0 24px',
          }}
        >
          <div
            style={{
              fontSize: 128,
              fontWeight: 800,
              lineHeight: 0.85,
              color: tone.accent,
              letterSpacing: '-0.05em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {data.total_owned.toLocaleString()}
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: tone.headline,
              letterSpacing: '-0.01em',
            }}
          >
            보유 게임
          </div>
        </div>
      </div>

      {/* Backlog 강조 박스 */}
      <div
        style={{
          margin: '0 24px 14px',
          padding: '14px 16px',
          background: tone.chip,
          border: `1px solid ${tone.chipBorder}`,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: tone.muted,
              letterSpacing: '0.1em',
              fontWeight: 600,
            }}
          >

          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: tone.headline,
              marginTop: 4,
              letterSpacing: '-0.01em',
            }}
          >
            구매 후 플레이 하지 않은 {data.unplayed}개
          </div>
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: tone.accent2,
            letterSpacing: '-0.03em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {data.unplayed_pct}
          <span style={{ fontSize: 16, fontWeight: 600, marginLeft: 2 }}>%</span>
        </div>
      </div>
    </CardShell>
  );
}
