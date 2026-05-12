// 카드 5 — Devoted Fan (Artist Loyalty)
// 디자인 핸드오프 cards-tier1b.jsx의 CardLoyalty를 React/TS로 이식
import CardShell from '../CardShell';
import ArtTile from '../ArtTile';
import type { Tone } from '@/lib/wrapped/tones';
import type { WrappedLoyalty } from '@/lib/wrapped/types';

interface Props {
  tone: Tone;
  loyalty: WrappedLoyalty;
  userName?: string;
  userHandle?: string;
  userAvatarUrl?: string | null;
}

export default function Loyalty({ tone, loyalty, userName, userHandle, userAvatarUrl }: Props) {
  return (
    <CardShell tone={tone} eyebrow="Top artist" userName={userName} userHandle={userHandle} userAvatarUrl={userAvatarUrl}>
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
          가장 많이 들은 아티스트
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
        <ArtTile
          color={loyalty.artist_color}
          initials={loyalty.artist_initials}
          imageUrl={loyalty.artist_image_url}
          size={170}
          radius={999}
          ink="#0A0A0F"
        />
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
