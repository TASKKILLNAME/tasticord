// Wrapped 카드 외곽 (모든 카드가 공유하는 프레임)
// 9:16 비율 — 미리보기 360×704, 출력시 1080×1920로 스케일
import type { ReactNode } from 'react';
import type { Tone } from '@/lib/wrapped/tones';

export const CARD_W = 360;
export const CARD_H = 704;

interface CardShellProps {
  tone: Tone;
  eyebrow?: string;
  children: ReactNode;
  userName?: string;
  userHandle?: string;
  userAvatarUrl?: string | null; // Tasticord 프로필 이미지 (없으면 accent 그라데이션 폴백)
  footerRight?: string;
}

export default function CardShell({
  tone,
  eyebrow,
  children,
  userName,
  userHandle,
  userAvatarUrl,
  footerRight,
}: CardShellProps) {
  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        background: tone.bgGradient,
        color: tone.fg,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-pretendard)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 상단 워터마크 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '52px 24px 0',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: tone.fg,
          }}
        >
          TASTICORD
        </div>
        <div
          style={{
            fontSize: 10,
            color: tone.muted,
            letterSpacing: '0.04em',
            fontWeight: 500,
          }}
        >
          {eyebrow || 'YOUR SOUND · 2026'}
        </div>
      </div>

      {/* 본문 영역 */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>

      {/* 푸터 — 사용자 식별 + POWERED BY */}
      <div
        style={{
          padding: '16px 24px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 2,
          borderTop: `1px solid ${tone.faint}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              overflow: 'hidden',
              // 아바타 URL 있으면 이미지로 채우고, 없으면 accent 그라데이션 폴백
              background: userAvatarUrl
                ? `url(${userAvatarUrl}) center/cover`
                : `linear-gradient(135deg, ${tone.accent}, ${tone.accent2})`,
            }}
          />
          <span style={{ fontSize: 11, color: tone.muted, fontWeight: 500 }}>
            {userName ?? '사용자'}
            {userHandle ? ` · ${userHandle}` : ''}
          </span>
        </div>
        <div style={{ fontSize: 9, color: tone.muted, letterSpacing: '0.1em' }}>
          {footerRight || 'POWERED BY SPOTIFY'}
        </div>
      </div>
    </div>
  );
}
