/**
 * One accent color per top-level nav group, shared by the header's hover
 * state and every page's eyebrow underneath that group -- so a page's
 * eyebrow always matches the color of the menu it lives under.
 */
export const SECTION_COLORS = {
  about: "#a9e8f9",
  activities: "#bb41a1",
  publications: "#009340",
  information: "#000000",
} as const;

export type Section = keyof typeof SECTION_COLORS;
