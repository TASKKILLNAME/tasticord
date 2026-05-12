// Tasticord Wrapped 톤 정의
// 디자인 핸드오프(tones.jsx) 기준. 현재는 Tone A(Midnight Pop) 한 가지만 사용.
// 추후 사용자가 톤을 고를 수 있게 되면 B, C도 활성화.

export type ToneId = 'A' | 'B' | 'C';

export interface Tone {
  id: ToneId;
  name: string;
  bg: string;
  bgGradient: string;
  fg: string;
  muted: string;
  faint: string;
  accent: string;
  accent2: string;
  accentInk: string;
  chip: string;
  chipBorder: string;
  headline: string;
  swatch: string[];
}

export const TONES: Record<ToneId, Tone> = {
  A: {
    id: 'A',
    name: 'Midnight Pop',
    bg: '#0A0A0F',
    bgGradient: 'radial-gradient(120% 80% at 70% 0%, #1A2B4A 0%, #0A0A0F 60%)',
    fg: '#FFFFFF',
    muted: 'rgba(255,255,255,0.55)',
    faint: 'rgba(255,255,255,0.18)',
    accent: '#7BD7FF',
    accent2: '#FF6B9D',
    accentInk: '#0A0A0F',
    chip: 'rgba(255,255,255,0.08)',
    chipBorder: 'rgba(255,255,255,0.12)',
    headline: '#FFFFFF',
    swatch: ['#7BD7FF', '#FF6B9D', '#FFD166', '#9B7BFF', '#5BCEAE'],
  },
  B: {
    id: 'B',
    name: 'Sunset Holo',
    bg: '#1A0B14',
    bgGradient: 'linear-gradient(165deg, #FF3D7F 0%, #FF6B35 45%, #1A0B14 100%)',
    fg: '#FFF6E8',
    muted: 'rgba(255,246,232,0.7)',
    faint: 'rgba(255,246,232,0.22)',
    accent: '#FFD166',
    accent2: '#FF3D7F',
    accentInk: '#1A0B14',
    chip: 'rgba(255,246,232,0.1)',
    chipBorder: 'rgba(255,246,232,0.18)',
    headline: '#FFF6E8',
    swatch: ['#FFD166', '#FF3D7F', '#FF6B35', '#FFAB76', '#5C2A4A'],
  },
  C: {
    id: 'C',
    name: 'Cyber Mint',
    bg: '#0B1622',
    bgGradient: 'radial-gradient(110% 70% at 30% 100%, #1B3A5C 0%, #0B1622 55%)',
    fg: '#EAF6FF',
    muted: 'rgba(234,246,255,0.6)',
    faint: 'rgba(234,246,255,0.18)',
    accent: '#7DF5C8',
    accent2: '#B6A6FF',
    accentInk: '#0B1622',
    chip: 'rgba(234,246,255,0.07)',
    chipBorder: 'rgba(234,246,255,0.14)',
    headline: '#EAF6FF',
    swatch: ['#7DF5C8', '#B6A6FF', '#7BD7FF', '#F0A8C9', '#FFE08A'],
  },
};

export const DEFAULT_TONE: ToneId = 'A';

// 장르 색상 팔레트 (도넛 차트용) — Tone A swatch 순환
export const GENRE_PALETTE = ['#FF6B9D', '#7BB6F0', '#FFD166', '#9B7BFF', '#5BCEAE', '#7BD7FF'];

// 트랙/아티스트 색상 팔레트 (이미지 없을 때 placeholder)
export const ARTIST_PALETTE = ['#A8D5FF', '#F4C9D4', '#1C1C1E', '#5B6B7A', '#E8D9C2'];
