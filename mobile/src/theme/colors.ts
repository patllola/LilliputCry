// Bubble Pop palette — soft, warm baby tones.
// Shared color tokens for the mobile app; every component/screen reads from here.
export const colors = {
  bg: "#fdeff6",
  surface: "#ffffff",
  accent: "#ff6fa5",
  accentSoft: "#e6dcff",
  text: "#4a2f42",
  muted: "#c39bb2",
  line: "#f7dfec",
  heroFrom: "#ff85b3",
  heroTo: "#b7a4ff",
  onHero: "#ffffff",

  // Per-feature card tints
  feeding: "#ffe1ec",
  feedingIcon: "#ff6fa5",
  sleep: "#e7ddff",
  sleepIcon: "#8b6fe0",
  pump: "#d9f0ff",
  pumpIcon: "#4aa8e0",
  medication: "#d7f5e8",
  medicationIcon: "#2fae8a",
  milestone: "#fff2cf",
  milestoneIcon: "#e0a92e",
  refer: "#ffe0d3",
  referIcon: "#f07a4a",
  plan: "#efe3ff",
  planIcon: "#7d5cd6",
  history: "#eef1ff",
  historyIcon: "#5b6fd6",

  danger: "#dc2626",
  dangerBg: "#fef2f2",
  dangerLine: "#f5b9b9",
  success: "#2fae8a",
  successBg: "#d7f5e8",

  admin: "#7c3aed",
  trial: "#4aa8e0",
} as const;

export const radius = { sm: 12, md: 16, lg: 20, xl: 24, pill: 22 } as const;
export const space = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24 } as const;
