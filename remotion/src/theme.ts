// System font stack — avoids fetching Google Fonts at render time
// (renders happen in network-restricted/offline environments).
// "Nimbus Sans" is a Helvetica-metric-compatible font bundled with most
// Linux font sets, giving a similar feel to the site's Inter typeface.
export const FONT_FAMILY = "'Helvetica Neue', 'Nimbus Sans', Arial, sans-serif";

// Matches the site's zinc/near-black palette (src/app/globals.css)
export const COLORS = {
  background: '#09090b', // zinc-950
  backgroundAlt: '#27272a', // zinc-800
  foreground: '#fafafa', // near white
  muted: '#a1a1aa', // zinc-400
};

export const AUDIENCE_LABELS: Record<string, string> = {
  athletes: 'Athletes',
  parents: 'Sports Parents',
};

export const audienceLabel = (audience: string): string =>
  AUDIENCE_LABELS[audience] ??
  audience.charAt(0).toUpperCase() + audience.slice(1);
