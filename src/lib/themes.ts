import type { CSSProperties } from "react";

export type EventTheme = {
  name: string;
  mode: "light" | "dark";
  /** Page background (any CSS background value). */
  bg: string;
  ink: string;
  muted: string;
  card: string;
  line: string;
  accent: string;
  accentInk: string;
  /** Tagline color; defaults to the accent. */
  accent2?: string;
  /** Offset shadow behind the highlighted title line, if any. */
  titleShadow?: string;
  /** Cover gradient when no photo is uploaded. */
  cover: string;
  /** Colors used by the floating effect layer. */
  sprinkles: string[];
};

export const THEMES = {
  popstar: {
    name: "Pop Star",
    mode: "light",
    bg: "radial-gradient(circle at 10% 16%, #ffe4f0, transparent 32%), radial-gradient(circle at 90% 22%, #d8c8ff, transparent 31%), linear-gradient(160deg, #fff1f1, #fce9ff 55%, #e8f8ff)",
    ink: "#281445",
    muted: "#735c79",
    card: "#fffdfdf2",
    line: "#ebdce9",
    accent: "#e63e9d",
    accentInk: "#ffffff",
    accent2: "#6940b7",
    titleShadow: "3px 4px 0 #ffffff",
    cover: "radial-gradient(circle at 50% 30%, #fff8d9 0, #ffb0df 31%, #ae84ed 68%, #593198 100%)",
    sprinkles: ["#9c79e9", "#ffcc65", "#74d7dc", "#f46cae"],
  },
  blush: {
    name: "Cotton Candy",
    mode: "light",
    bg: "radial-gradient(120% 80% at 10% 0%, oklch(92% 0.06 10) 0%, transparent 60%), radial-gradient(90% 70% at 100% 30%, oklch(92% 0.06 300) 0%, transparent 60%), oklch(97% 0.02 40)",
    ink: "oklch(30% 0.08 350)",
    muted: "oklch(48% 0.06 350)",
    card: "oklch(100% 0 0 / 0.62)",
    line: "oklch(30% 0.08 350 / 0.12)",
    accent: "oklch(66% 0.17 5)",
    accentInk: "oklch(99% 0.01 5)",
    cover: "linear-gradient(160deg, oklch(88% 0.08 5), oklch(85% 0.09 320) 55%, oklch(90% 0.07 60))",
    sprinkles: ["oklch(78% 0.14 5)", "oklch(80% 0.1 300)", "oklch(88% 0.12 90)", "oklch(82% 0.1 200)"],
  },
  lagoon: {
    name: "Under the Sea",
    mode: "dark",
    bg: "radial-gradient(100% 60% at 50% 0%, oklch(48% 0.09 200) 0%, transparent 70%), linear-gradient(180deg, oklch(32% 0.07 220), oklch(22% 0.06 250))",
    ink: "oklch(97% 0.02 200)",
    muted: "oklch(84% 0.04 200)",
    card: "oklch(100% 0 0 / 0.08)",
    line: "oklch(100% 0 0 / 0.14)",
    accent: "oklch(84% 0.13 180)",
    accentInk: "oklch(24% 0.06 220)",
    cover: "linear-gradient(170deg, oklch(70% 0.12 190), oklch(45% 0.1 230))",
    sprinkles: ["oklch(95% 0.03 200 / 0.7)", "oklch(85% 0.1 180 / 0.6)"],
  },
  starry: {
    name: "Starry Night",
    mode: "dark",
    bg: "radial-gradient(80% 50% at 80% 0%, oklch(38% 0.12 290) 0%, transparent 70%), linear-gradient(180deg, oklch(22% 0.06 275), oklch(15% 0.04 270))",
    ink: "oklch(96% 0.02 90)",
    muted: "oklch(80% 0.03 280)",
    card: "oklch(100% 0 0 / 0.07)",
    line: "oklch(100% 0 0 / 0.13)",
    accent: "oklch(86% 0.13 85)",
    accentInk: "oklch(22% 0.05 275)",
    cover: "linear-gradient(170deg, oklch(35% 0.12 285), oklch(20% 0.06 270))",
    sprinkles: ["oklch(95% 0.08 90)", "oklch(98% 0.01 0)"],
  },
  sunshine: {
    name: "Sunshine",
    mode: "light",
    bg: "radial-gradient(90% 60% at 0% 0%, oklch(93% 0.1 95) 0%, transparent 65%), radial-gradient(80% 60% at 100% 100%, oklch(90% 0.08 50) 0%, transparent 60%), oklch(98% 0.03 90)",
    ink: "oklch(32% 0.07 45)",
    muted: "oklch(48% 0.07 50)",
    card: "oklch(100% 0 0 / 0.66)",
    line: "oklch(32% 0.07 45 / 0.12)",
    accent: "oklch(68% 0.17 45)",
    accentInk: "oklch(99% 0.01 90)",
    cover: "linear-gradient(160deg, oklch(90% 0.14 95), oklch(80% 0.14 55))",
    sprinkles: ["oklch(80% 0.16 80)", "oklch(74% 0.16 40)", "oklch(84% 0.12 140)"],
  },
  meadow: {
    name: "Garden Party",
    mode: "light",
    bg: "radial-gradient(90% 60% at 100% 0%, oklch(92% 0.05 140) 0%, transparent 60%), radial-gradient(70% 50% at 0% 100%, oklch(93% 0.05 20) 0%, transparent 60%), oklch(97% 0.02 110)",
    ink: "oklch(30% 0.05 150)",
    muted: "oklch(46% 0.05 150)",
    card: "oklch(100% 0 0 / 0.66)",
    line: "oklch(30% 0.05 150 / 0.12)",
    accent: "oklch(55% 0.11 150)",
    accentInk: "oklch(99% 0.01 110)",
    cover: "linear-gradient(160deg, oklch(88% 0.07 140), oklch(90% 0.06 20) 70%)",
    sprinkles: ["oklch(80% 0.1 10)", "oklch(88% 0.1 95)", "oklch(75% 0.1 150)", "oklch(100% 0 0)"],
  },
  lavender: {
    name: "Fairy Dust",
    mode: "light",
    bg: "radial-gradient(100% 70% at 50% 0%, oklch(90% 0.06 300) 0%, transparent 70%), oklch(97% 0.02 300)",
    ink: "oklch(30% 0.09 300)",
    muted: "oklch(48% 0.07 300)",
    card: "oklch(100% 0 0 / 0.62)",
    line: "oklch(30% 0.09 300 / 0.12)",
    accent: "oklch(58% 0.17 300)",
    accentInk: "oklch(99% 0.01 300)",
    cover: "linear-gradient(165deg, oklch(85% 0.08 300), oklch(88% 0.07 250) 50%, oklch(92% 0.06 340))",
    sprinkles: ["oklch(80% 0.12 300)", "oklch(90% 0.1 90)", "oklch(85% 0.08 340)"],
  },
  disco: {
    name: "Disco Sunset",
    mode: "dark",
    bg: "radial-gradient(70% 60% at 0% 60%, oklch(50% 0.13 40 / 0.8) 0%, transparent 70%), radial-gradient(60% 50% at 100% 0%, oklch(40% 0.14 330 / 0.7) 0%, transparent 70%), oklch(16% 0.03 300)",
    ink: "oklch(97% 0.01 60)",
    muted: "oklch(82% 0.03 40)",
    card: "oklch(100% 0 0 / 0.08)",
    line: "oklch(100% 0 0 / 0.14)",
    accent: "oklch(78% 0.15 55)",
    accentInk: "oklch(20% 0.04 330)",
    cover: "linear-gradient(170deg, oklch(70% 0.16 40), oklch(45% 0.17 340))",
    sprinkles: ["oklch(85% 0.14 70)", "oklch(72% 0.18 350)", "oklch(80% 0.1 200)"],
  },
  rainbow: {
    name: "Rainbow",
    mode: "light",
    bg: "oklch(98% 0.015 85)",
    ink: "oklch(28% 0.03 280)",
    muted: "oklch(46% 0.03 280)",
    card: "oklch(100% 0 0 / 0.8)",
    line: "oklch(28% 0.03 280 / 0.12)",
    accent: "oklch(60% 0.2 25)",
    accentInk: "oklch(99% 0 0)",
    cover: "linear-gradient(135deg, oklch(80% 0.14 20), oklch(88% 0.14 85), oklch(82% 0.13 150), oklch(78% 0.12 240), oklch(75% 0.13 300))",
    sprinkles: ["oklch(70% 0.19 25)", "oklch(85% 0.16 85)", "oklch(72% 0.15 150)", "oklch(65% 0.15 250)", "oklch(65% 0.17 310)"],
  },
} satisfies Record<string, EventTheme>;

export type ThemeKey = keyof typeof THEMES;

export function getTheme(key: string): EventTheme {
  return THEMES[key as ThemeKey] ?? THEMES.blush;
}

export function themeStyle(theme: EventTheme): CSSProperties {
  return {
    "--ev-bg": theme.bg,
    "--ev-ink": theme.ink,
    "--ev-muted": theme.muted,
    "--ev-card": theme.card,
    "--ev-line": theme.line,
    "--ev-accent": theme.accent,
    "--ev-accent-ink": theme.accentInk,
    "--ev-accent-2": theme.accent2 ?? theme.accent,
    "--ev-title-shadow": theme.titleShadow ?? "none",
    "--ev-on-ink": theme.mode === "light" ? "#ffffff" : "oklch(20% 0.03 280)",
    "--ev-cover": theme.cover,
    colorScheme: theme.mode,
  } as CSSProperties;
}

export const EFFECTS = {
  none: "None",
  confetti: "Confetti",
  bubbles: "Bubbles",
  stars: "Twinkles",
  hearts: "Hearts",
  petals: "Petals",
} as const;

export type EffectKey = keyof typeof EFFECTS;
