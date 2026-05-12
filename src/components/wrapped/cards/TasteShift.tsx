// 카드 7 — Then vs Now (Taste Shift) — COMPARE 템플릿
// 디자인 핸드오프 cards-tier2.jsx의 CardTasteShift를 React/TS로 이식
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

// 한 블록(↑ 새로 빠진 / ∞ 변함없는)의 공통 구조
function CompareBlock({
  tone,
  label,
  labelColor,
  artist,
  sub,
}: {
  tone: Tone;
  label: string;
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
          최근 4주 vs 평생 취향
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

      {/* 2단 비교 블록 */}
      <div
        style={{
          flex: 1,
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          justifyContent: 'center',
        }}
      >
        <CompareBlock
          tone={tone}
          label="↑ 새로 빠진"
          labelColor={tone.accent}
          artist={shift.new_love}
          sub="최근 차트에 새로 등장"
        />
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
