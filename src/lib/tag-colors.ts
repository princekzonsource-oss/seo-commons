const PALETTE = [
  "#ff4500", "#ff8c00", "#ffd700", "#00c853", "#00bcd4",
  "#3f51b5", "#9c27b0", "#e91e63", "#2196f3", "#009688",
];

export function getTagColor(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  const color = PALETTE[Math.abs(hash) % PALETTE.length];
  return { color, background: color + "22" };
}