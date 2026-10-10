export const TITLE_FONTS = {
  classic: { family: "var(--font-fraunces)", settings: "'SOFT' 100, 'WONK' 1", weight: 500, tracking: "-0.02em" },
  playful: { family: "var(--font-baloo)", settings: "normal", weight: 700, tracking: "-0.01em" },
  fancy: { family: "var(--font-pacifico)", settings: "normal", weight: 400, tracking: "0" },
  storybook: { family: "var(--font-playfair)", settings: "normal", weight: 600, tracking: "-0.01em" },
  pop: { family: "var(--font-outfit)", settings: "normal", weight: 900, tracking: "-0.06em" },
  bubbly: { family: "var(--font-chewy)", settings: "normal", weight: 400, tracking: "0.01em" },
  digital: { family: "var(--font-silkscreen)", settings: "normal", weight: 400, tracking: "0" },
} as const;

export type TitleFontKey = keyof typeof TITLE_FONTS;

export function getTitleFont(key: string) {
  return TITLE_FONTS[key as TitleFontKey] ?? TITLE_FONTS.classic;
}
