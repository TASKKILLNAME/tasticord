// 아티스트/트랙/게임 아트 타일
// 이미지가 있으면 노출, 실패 시 fallback URL 시도, 그것도 실패하면 색 그라데이션 + 이니셜
'use client';

import { useState } from 'react';
import { shade } from './shade';

interface ArtTileProps {
  color?: string;
  initials?: string;
  imageUrl?: string | null;
  fallbackImageUrl?: string | null; // 1차 imageUrl 실패 시 시도할 두번째 URL (예: Steam Store API 프록시)
  size?: number;
  radius?: number;
  ink?: string;
}

type Stage = 'primary' | 'fallback' | 'failed';

export default function ArtTile({
  color = '#7BD7FF',
  initials = '••',
  imageUrl,
  fallbackImageUrl,
  size = 80,
  radius = 12,
  ink = '#0A0A0F',
}: ArtTileProps) {
  // 'primary' → 'fallback' → 'failed' 순서로 시도
  const [stage, setStage] = useState<Stage>('primary');

  const activeUrl =
    stage === 'primary' && imageUrl
      ? imageUrl
      : stage === 'fallback' && fallbackImageUrl
      ? fallbackImageUrl
      : null;

  const handleError = () => {
    if (stage === 'primary' && fallbackImageUrl) {
      setStage('fallback');
    } else {
      setStage('failed');
    }
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        position: 'relative',
        overflow: 'hidden',
        // 폴백 — 항상 렌더 (이미지가 위에 올라와 가려짐, 실패 시 그대로 노출)
        background: `linear-gradient(135deg, ${color} 0%, ${shade(color, -25)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 500,
        fontSize: size * 0.36,
        color: ink,
        letterSpacing: '-0.02em',
      }}
    >
      {initials}
      {activeUrl && (
        <img
          key={activeUrl}
          src={activeUrl}
          alt=""
          onError={handleError}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
    </div>
  );
}
