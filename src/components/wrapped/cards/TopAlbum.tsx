// 카드 6 — Top Album (SINGLE-FOCUS template)
// 디자인 핸드오프 cards-template.jsx의 CardTopAlbum을 React/TS로 이식
import CardShell from '../CardShell';
import { shade } from '../shade';
import type { Tone } from '@/lib/wrapped/tones';
import type { WrappedAlbum } from '@/lib/wrapped/types';

interface Props {
  tone: Tone;
  album: WrappedAlbum;
  userName?: string;
  userHandle?: string;
  userAvatarUrl?: string | null;
}

export default function TopAlbum({ tone, album, userName, userHandle, userAvatarUrl }: Props) {
  // 이미지가 있으면 그 위에 그라데이션 오버레이로 텍스트 가독성 확보, 없으면 색 그라데이션만
  const coverBackground = album.image_url
    ? `linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 50%), url(${album.image_url}) center/cover`
    : `linear-gradient(135deg, ${album.color}, ${shade(album.color, -35)})`;

  return (
    <CardShell tone={tone} eyebrow="MOST PLAYED ALBUM" userName={userName} userHandle={userHandle} userAvatarUrl={userAvatarUrl}>
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
          최근 당신이 깊게 빠진
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
          Top
          <br />
          Album
        </h1>
      </div>

      {/* 대형 앨범 커버 */}
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
            width: 260,
            height: 260,
            borderRadius: 8,
            background: coverBackground,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            padding: 18,
          }}
        >
          <div
            style={{
              fontSize: 38,
              fontWeight: 800,
              lineHeight: 0.95,
              color: '#fff',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              // 긴 앨범명 안 잘리도록 wrap
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
            }}
          >
            {album.name}
          </div>
        </div>
      </div>

      {/* 좌: 아티스트명 + 설명 / 우: 큰 숫자 */}
      <div
        style={{
          padding: '0 24px 14px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ minWidth: 0, flex: 1, marginRight: 12 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: tone.headline,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {album.artist}
          </div>
          <div style={{ fontSize: 12, color: tone.muted, marginTop: 2 }}>
            Top 50 중 {album.count}곡 수록
          </div>
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: tone.accent,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          {album.count}
          <span style={{ fontSize: 16, fontWeight: 600, marginLeft: 4, letterSpacing: 0 }}>곡</span>
        </div>
      </div>
    </CardShell>
  );
}
