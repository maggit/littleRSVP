import { Baloo_2, Chewy, Figtree, Fraunces, Outfit, Pacifico, Playfair_Display, Silkscreen } from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
});

export const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

const baloo = Baloo_2({ subsets: ["latin"], weight: ["700"], variable: "--font-baloo", preload: false });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400", variable: "--font-pacifico", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600"], variable: "--font-playfair", preload: false });
const chewy = Chewy({ subsets: ["latin"], weight: "400", variable: "--font-chewy", preload: false });
const outfit = Outfit({ subsets: ["latin"], weight: ["800", "900"], variable: "--font-outfit", preload: false });
const silkscreen = Silkscreen({ subsets: ["latin"], weight: "400", variable: "--font-silkscreen", preload: false });

export const fontVariables = [fraunces, figtree, baloo, pacifico, playfair, chewy, outfit, silkscreen]
  .map((f) => f.variable)
  .join(" ");
