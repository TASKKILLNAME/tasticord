// 카드 6 — Top Album (SINGLE-FOCUS template)
// 디자인 핸드오프 cards-template.jsx의 CardTopAlbum을 React/TS로 이식
// LP 디스크 디자인: 회전하는 비닐 본체 + 동심원 그루브 + 중앙 라벨에 앨범 커버 + 스핀들 홀
// 앨범명은 LP 위가 아니라 푸터 영역으로 이동 (회전 텍스트는 가독성 나쁨)
'use client';

import CardShell from '../CardShell';
import { shade } from '../shade';
import type { Tone } from '@/lib/wrapped/tones';
import { type WrappedAlbum, type TimeRange, TIME_RANGE_LABELS } from '@/lib/wrapped/types';

interface Props {
  tone: Tone;
  album: WrappedAlbum;
  timeRange: TimeRange;
  userName?: string;
  userHandle?: string;
  userAvatarUrl?: string | null;
}

export default function TopAlbum({ tone, album, timeRange, userName, userHandle, userAvatarUrl }: Props) {
  const period = TIME_RANGE_LABELS[timeRange].ko;
  // LP 중앙 라벨용 — 텍스트가 그 위에 올라가지 않으니 어두운 오버레이 제거
  const labelBackground = album.image_url
    ? `url(${album.image_url}) center/cover`
    : `linear-gradient(135deg, ${album.color}, ${shade(album.color, -35)})`;

  return (
    <CardShell tone={tone} eyebrow={`Top Album · ${period}`} userName={userName} userHandle={userHandle} userAvatarUrl={userAvatarUrl}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes top-album-lp-spin {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
          `,
        }}
      />
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

      {/* LP 디스크 영역 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 24px',
        }}
      >
        {/* LP 본체 — 회전하는 비닐 디스크 (전체 면적이 앨범 이미지) */}
        <div
          style={{
            position: 'relative',
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: labelBackground,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
            animation: 'top-album-lp-spin 14s linear infinite',
            overflow: 'hidden',
          }}
        >
          {/* 스핀들 홀 — LP 정중앙 */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#050505',
              boxShadow:
                'inset 0 1px 2px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.15)',
            }}
          />
        </div>
      </div>

      {/* 푸터 — 앨범명/아티스트/곡수 + 큰 카운트 */}
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
              fontSize: 18,
              fontWeight: 700,
              color: tone.headline,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {album.name}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: tone.muted,
              marginTop: 2,
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
