import type { EventView } from "@/lib/event";

/** The artwork under the title: an uploaded image shown whole, or the theme gradient with an emoji. */
export function Cover({ event, imageSrc }: { event: EventView; imageSrc?: string | null }) {
  const src = imageSrc ?? (event.coverImageId ? `/api/images/${event.coverImageId}` : null);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="mx-auto block max-h-[420px] w-auto max-w-full object-contain drop-shadow-[0_14px_24px_rgb(0_0_0/0.14)]" />;
  }
  return (
    <div className="mx-auto grid aspect-[4/3] w-full max-w-[430px] place-items-center rounded-[48%_48%_40%_40%] border-[7px] border-white/60 bg-(image:--ev-cover) shadow-[0_10px_45px_-10px_rgb(0_0_0/0.35)]">
      <span className="cover-emoji select-none text-[clamp(6rem,24cqi,9rem)] leading-none">{event.coverEmoji || "🎉"}</span>
    </div>
  );
}
