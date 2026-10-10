import type { CSSProperties } from "react";
import type { EffectKey } from "@/lib/themes";

// Deterministic PRNG so server and client render identical particles.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const COUNT: Record<EffectKey, number> = { none: 0, confetti: 36, bubbles: 22, stars: 34, hearts: 18, petals: 24 };

export function Sprinkles({ effect, colors, contained = false }: { effect: string; colors: string[]; contained?: boolean }) {
  const kind = (effect in COUNT ? effect : "none") as EffectKey;
  const n = COUNT[kind];
  if (!n) return null;
  const rand = rng(kind.length * 7919 + 17);
  const pieces = Array.from({ length: n }, (_, i) => {
    const size = kind === "stars" ? 8 + rand() * 14 : kind === "bubbles" ? 10 + rand() * 34 : 7 + rand() * 9;
    const style = {
      left: `${rand() * 100}%`,
      top: kind === "stars" ? `${rand() * 100}%` : undefined,
      "--size": `${size}px`,
      "--dur": `${(kind === "stars" ? 2.5 : 9) + rand() * 9}s`,
      "--delay": `${-rand() * 18}s`,
      "--sway": `${(rand() - 0.5) * 80}px`,
      "--spin": `${(rand() > 0.5 ? 1 : -1) * (180 + rand() * 540)}deg`,
      "--c": colors[i % colors.length],
    } as CSSProperties;
    return <span key={i} className={`sprinkle sprinkle-${kind}`} style={style} />;
  });
  return (
    <div aria-hidden className={`sprinkles ${contained ? "absolute" : "fixed"} inset-0 overflow-hidden pointer-events-none`}>
      {pieces}
    </div>
  );
}
