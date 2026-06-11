// Shared color tokens for the mobile app.
// Extracted from the per-screen StyleSheets so every component stays consistent.
export const colors = {
  bg: "#f9fafb",
  surface: "#fff",

  brand: "#9333ea",
  brandDark: "#7e22ce",
  brandText: "#6b21a8",
  brandTint: "#faf5ff",
  brandBorder: "#e9d5ff",

  text: "#111827",
  textMuted: "#6b7280",
  textSubtle: "#9ca3af",
  label: "#374151",

  border: "#e5e7eb",
  borderLight: "#f3f4f6",

  danger: "#dc2626",
  dangerBg: "#fef2f2",
  dangerBorder: "#fca5a5",

  success: "#16a34a",
  successBg: "#f0fdf4",
} as const;
