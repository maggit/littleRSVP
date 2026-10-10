export const TITLE_FONTS = {
  classic: { name: "Classic", family: "var(--font-fraunces)", settings: "'SOFT' 100, 'WONK' 1", weight: 500, tracking: "-0.02em" },
  playful: { name: "Playful", family: "var(--font-baloo)", settings: "normal", weight: 700, tracking: "-0.01em" },
  fancy: { name: "Fancy", family: "var(--font-pacifico)", settings: "normal", weight: 400, tracking: "0" },
  storybook: { name: "Storybook", family: "var(--font-playfair)", settings: "normal", weight: 600, tracking: "-0.01em" },
  pop: { name: "Pop Star", family: "var(--font-outfit)", settings: "normal", weight: 900, tracking: "-0.06em" },
  bubbly: { name: "Bubbly", family: "var(--font-chewy)", settings: "normal", weight: 400, tracking: "0.01em" },
  digital: { name: "Digital", family: "var(--font-silkscreen)", settings: "normal", weight: 400, tracking: "0" },
} as const;

export type TitleFontKey = keyof typeof TITLE_FONTS;

export function getTitleFont(key: string) {
  return TITLE_FONTS[key as TitleFontKey] ?? TITLE_FONTS.classic;
}
