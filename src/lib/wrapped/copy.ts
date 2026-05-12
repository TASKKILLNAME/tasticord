// Wrapped 카드 본문 카피 — 기간별로 분기
// 헤드라인 위쪽 라벨(eyebrow 다음 줄), 하단 카피 두 줄을 기간에 맞게 바꿈
// "올해 ~", "요즘 ~", "최근 한 달 ~" 톤이 다 다름
import type { TimeRange } from './types';

interface CardCopy {
  preHeadline: string; // 헤드라인 위 작은 라벨 (예: "올해 당신을 가장 많이 흔든")
  tagline?: string; // 하단 마무리 카피
}

interface CopyByCard {
  artists: CardCopy;
  tracks: CardCopy;
  genres: CardCopy;
}

export const COPY: Record<TimeRange, CopyByCard> = {
  short_term: {
    artists: {
      preHeadline: '최근 한 달 당신을 흔든',
      tagline: '이 다섯 명이 최근 당신의 플레이리스트를 채웠어요.',
    },
    tracks: {
      preHeadline: '최근 한 달의 사운드트랙',
      tagline: '이 다섯 곡이 요새 당신을 채웠어요.',
    },
    genres: {
      preHeadline: '최근 당신의 사운드는',
    },
  },
  medium_term: {
    artists: {
      preHeadline: '요즘 당신을 가장 많이 흔든',
      tagline: '이 다섯 명이 요즘 당신의 사운드를 만들었어요.',
    },
    tracks: {
      preHeadline: '요즘의 사운드트랙',
      tagline: '이 다섯 곡이 요즘 당신을 채웠어요.',
    },
    genres: {
      preHeadline: '요즘 당신의 사운드는',
    },
  },
  long_term: {
    artists: {
      preHeadline: '오랫동안 당신을 흔들어 온',
      tagline: '이 다섯 명이 당신의 음악 취향을 정의해요.',
    },
    tracks: {
      preHeadline: '당신의 시그니처 사운드트랙',
      tagline: '이 다섯 곡이 당신을 만들었어요.',
    },
    genres: {
      preHeadline: '당신의 사운드는',
    },
  },
};
