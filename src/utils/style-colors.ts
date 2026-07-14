type StyleColorSet = {
  background: string;
  text: string;
  border: string;
};

const STYLE_COLOR_MAP: Record<string, StyleColorSet> = {
  jazz: { background: 'rgba(88, 101, 242, 0.15)', text: '#5865f2', border: 'rgba(88, 101, 242, 0.35)' },
  blues: { background: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.35)' },
  rock: { background: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.35)' },
  pop: { background: 'rgba(236, 72, 153, 0.15)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.35)' },
  funk: { background: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: 'rgba(234, 179, 8, 0.35)' },
  soul: { background: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.35)' },
  rnb: { background: 'rgba(244, 114, 182, 0.15)', text: '#f472b6', border: 'rgba(244, 114, 182, 0.35)' },
  'hip-hop': { background: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: 'rgba(249, 115, 22, 0.35)' },
  reggae: { background: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.35)' },
  metal: { background: 'rgba(100, 116, 139, 0.2)', text: '#94a3b8', border: 'rgba(100, 116, 139, 0.4)' },
  punk: { background: 'rgba(220, 38, 38, 0.15)', text: '#dc2626', border: 'rgba(220, 38, 38, 0.35)' },
  folk: { background: 'rgba(180, 83, 9, 0.15)', text: '#b45309', border: 'rgba(180, 83, 9, 0.35)' },
  country: { background: 'rgba(217, 119, 6, 0.15)', text: '#d97706', border: 'rgba(217, 119, 6, 0.35)' },
  classique: { background: 'rgba(99, 102, 241, 0.15)', text: '#6366f1', border: 'rgba(99, 102, 241, 0.35)' },
  electro: { background: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', border: 'rgba(6, 182, 212, 0.35)' },
  house: { background: 'rgba(14, 165, 233, 0.15)', text: '#0ea5e9', border: 'rgba(14, 165, 233, 0.35)' },
  techno: { background: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.35)' },
  world: { background: 'rgba(20, 184, 166, 0.15)', text: '#14b8a6', border: 'rgba(20, 184, 166, 0.35)' },
  latin: { background: 'rgba(246, 88, 88, 0.15)', text: '#f65858', border: 'rgba(246, 88, 88, 0.35)' },
  fusion: { background: 'rgba(30, 215, 96, 0.15)', text: '#1ed760', border: 'rgba(30, 215, 96, 0.35)' },
};

const DEFAULT_STYLE_COLORS: StyleColorSet = {
  background: 'rgba(88, 101, 242, 0.12)',
  text: '#5865f2',
  border: 'rgba(88, 101, 242, 0.3)',
};

export function getStyleColors(slug: string): StyleColorSet {
  return STYLE_COLOR_MAP[slug] ?? DEFAULT_STYLE_COLORS;
}
