// hex 색을 pct만큼 어둡게(-) / 밝게(+) 함
// 카드 아트 타일에서 그라데이션 끝점을 만들 때 사용
export function shade(hex: string, pct: number): string {
  const h = hex.replace('#', '');
  const expanded = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(expanded, 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const f = pct / 100;
  r = Math.max(0, Math.min(255, Math.round(r + (f < 0 ? r * f : (255 - r) * f))));
  g = Math.max(0, Math.min(255, Math.round(g + (f < 0 ? g * f : (255 - g) * f))));
  b = Math.max(0, Math.min(255, Math.round(b + (f < 0 ? b * f : (255 - b) * f))));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
