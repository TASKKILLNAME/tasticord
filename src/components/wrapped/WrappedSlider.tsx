// Wrapped 슬라이드 컨테이너
// - 좌우 스와이프 / 탭 영역(왼쪽 절반=이전, 오른쪽 절반=다음) / 키보드 화살표
// - 자동 넘김 X (사용자가 직접)
// - 상단에 진행도 막대 (현재 카드 위치 표시)
'use client';

import { useState, useRef, useEffect, type ReactNode, type TouchEvent } from 'react';
import type { Tone } from '@/lib/wrapped/tones';
import { CARD_W, CARD_H } from './CardShell';

interface Props {
  tone: Tone;
  cards: ReactNode[];
}

const SWIPE_THRESHOLD = 40; // px

export default function WrappedSlider({ tone, cards }: Props) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const total = cards.length;

  // 키보드 좌우 화살표 (콜백을 안에 인라인해서 dep 누락 회피)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(total - 1, i + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [total]);

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(total - 1, i + 1));

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > SWIPE_THRESHOLD) goPrev();
    else if (dx < -SWIPE_THRESHOLD) goNext();
    touchStartX.current = null;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        userSelect: 'none',
      }}
    >
      {/* 진행도 막대 (상단) */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          width: CARD_W,
        }}
      >
        {cards.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i <= index ? tone.fg : tone.faint,
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>

      {/* 카드 + 탭 존 */}
      <div
        style={{ position: 'relative', width: CARD_W, height: CARD_H }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {cards[index]}

        {/* 탭 존 — 데스크탑에서도 클릭으로 넘김 */}
        <button
          type="button"
          aria-label="이전"
          onClick={goPrev}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '40%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            cursor: index === 0 ? 'default' : 'pointer',
            zIndex: 3,
          }}
        />
        <button
          type="button"
          aria-label="다음"
          onClick={goNext}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            cursor: index === total - 1 ? 'default' : 'pointer',
            zIndex: 3,
          }}
        />
      </div>

      {/* 카드 번호 (사용자 안내) */}
      <div
        style={{
          fontSize: 11,
          color: tone.muted,
          letterSpacing: '0.1em',
          fontFamily: 'var(--font-pretendard)',
        }}
      >
        {index + 1} / {total}
      </div>
    </div>
  );
}
