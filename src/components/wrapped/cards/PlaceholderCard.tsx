// Card 4-12 자리만 잡아둔 placeholder
// 본격 구현은 추후 디자인 핸드오프 받고 진행
import CardShell from '../CardShell';
import type { Tone } from '@/lib/wrapped/tones';

interface Props {
  tone: Tone;
  cardNumber: number;
  title: string;
  userName?: string;
  userHandle?: string;
  userAvatarUrl?: string | null;
  footerRight?: string;
}

export default function PlaceholderCard({ tone, cardNumber, title, userName, userHandle, userAvatarUrl, footerRight }: Props) {
  return (
    <CardShell tone={tone} eyebrow={`CARD ${cardNumber} · 2026`} userName={userName} userHandle={userHandle} userAvatarUrl={userAvatarUrl} footerRight={footerRight}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 32px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: tone.muted,
            letterSpacing: '0.16em',
            marginBottom: 16,
          }}
        >
          COMING SOON
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 36,
            fontWeight: 800,
            lineHeight: 1.05,
            color: tone.headline,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>
        <div
          style={{
            marginTop: 16,
            fontSize: 13,
            color: tone.muted,
            lineHeight: 1.5,
          }}
        >
          이 카드는 준비 중이에요.
        </div>
      </div>
    </CardShell>
  );
}
