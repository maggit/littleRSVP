"use client";

import { useActionState, useState } from "react";
import { submitRsvp, type RsvpState } from "@/app/e/[slug]/actions";
import { MAX_GUESTS_PER_KIND, type MyRsvp } from "@/lib/event";
import { getDict, type Dict, type Lang } from "@/lib/i18n";
import type { RsvpSettings } from "@/lib/sections";

type Status = "going" | "maybe" | "no";

const STATUSES: Status[] = ["going", "maybe", "no"];

function Stepper({ name, label, value, onChange, min = 0, t }: { name: string; label: string; value: number; onChange: (n: number) => void; min?: number; t: Dict }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-(--ev-line) px-4 py-2.5">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={t.rsvp.fewer(label)} disabled={value <= min} onClick={() => onChange(value - 1)} className="ev-step">−</button>
        <output className="w-5 text-center font-semibold tabular-nums">{value}</output>
        <button type="button" aria-label={t.rsvp.more(label)} disabled={value >= MAX_GUESTS_PER_KIND} onClick={() => onChange(value + 1)} className="ev-step">+</button>
        <input type="hidden" name={name} value={value} />
      </div>
    </div>
  );
}

export function RsvpCard({
  slug,
  settings,
  mine,
  closedReason,
  lang,
  preview = false,
}: {
  slug: string;
  settings: RsvpSettings;
  mine: MyRsvp;
  closedReason: string | null;
  lang: Lang;
  preview?: boolean;
}) {
  const t = getDict(lang);
  const [state, action, pending] = useActionState<RsvpState, FormData>(submitRsvp, { ok: false });
  const [status, setStatus] = useState<Status | null>(null);
  const [openedAt, setOpenedAt] = useState(0);
  const [adults, setAdults] = useState(mine?.adults || 1);
  const [kids, setKids] = useState(mine?.kids ?? 0);

  // A successful submit after the form was opened closes it again.
  const editing = status !== null && !(state.ok && (state.at ?? 0) > openedAt);
  const choose = (next: Status) => {
    if (!editing) setOpenedAt(Date.now());
    setStatus(next);
  };
  const labels = settings.labels;

  return (
    <section className="rounded-[1.75rem] border border-(--ev-line) bg-(--ev-card) p-6 backdrop-blur-md @xl:p-7" aria-labelledby="rsvp-title">
      {mine && !editing ? (
        <div className="text-center">
          <p className="text-5xl">{labels[mine.status].emoji}</p>
          <h2 id="rsvp-title" className="ev-heading mt-3 text-2xl">{t.rsvp.headline[mine.status]}</h2>
          <p className="mt-1 text-(--ev-muted)">
            {mine.name}
            {mine.status !== "no" && settings.askCounts && ` · ${t.rsvp.partySize(mine.adults, mine.kids)}`}
          </p>
          {!closedReason && (
            <button type="button" onClick={() => choose(mine.status)} className="ev-link mt-4 text-sm font-semibold">
              {t.rsvp.change}
            </button>
          )}
        </div>
      ) : (
        <h2 id="rsvp-title" className="ev-heading mb-5 text-center text-2xl">{closedReason ? t.rsvp.title : t.rsvp.question}</h2>
      )}

      {closedReason ? (
        <p className="mt-2 text-center text-(--ev-muted)">{closedReason}</p>
      ) : (
        (!mine || editing) && (
          <>
            <div role="radiogroup" aria-label={t.rsvp.yourAnswer} className="grid grid-cols-3 gap-3">
              {STATUSES.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={editing && status === key}
                  onClick={() => choose(key)}
                  className="ev-choice group flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-(--ev-line) px-2 py-4"
                >
                  <span className="text-[clamp(1.75rem,6vw,2.5rem)] leading-none transition-transform duration-200 group-hover:-translate-y-0.5">{labels[key].emoji}</span>
                  <span className="text-sm font-semibold">{labels[key].text}</span>
                </button>
              ))}
            </div>

            {editing && (
              <form action={action} className="mt-5 space-y-3">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="status" value={status!} />
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
                <label className="block">
                  <span className="sr-only">{t.rsvp.yourName}</span>
                  <input name="name" required maxLength={80} defaultValue={mine?.name} placeholder={t.rsvp.yourName} autoComplete="name" className="ev-input" />
                </label>
                {settings.askCounts && status !== "no" && (
                  <>
                    <Stepper name="adults" label={t.rsvp.adults} value={adults} onChange={setAdults} t={t} />
                    <Stepper name="kids" label={t.rsvp.kids} value={kids} onChange={setKids} t={t} />
                  </>
                )}
                {settings.askContact && status !== "no" && (
                  <>
                    <label className="block">
                      <span className="sr-only">{t.rsvp.email}</span>
                      <input name="email" type="email" maxLength={200} defaultValue={mine?.email} placeholder={t.rsvp.email} autoComplete="email" className="ev-input" />
                    </label>
                    <label className="block">
                      <span className="sr-only">{t.rsvp.phone}</span>
                      <input name="phone" type="tel" maxLength={40} defaultValue={mine?.phone} placeholder={t.rsvp.phone} autoComplete="tel" className="ev-input" />
                    </label>
                    <p className="text-xs text-(--ev-muted)">
                      {settings.contactRequired ? t.rsvp.contactRequired : t.rsvp.contactOptional}
                    </p>
                  </>
                )}
                {settings.askNote && (
                  <label className="block">
                    <span className="sr-only">{settings.notePrompt || t.rsvp.note}</span>
                    <textarea name="note" rows={2} maxLength={1000} defaultValue={mine?.note} placeholder={settings.notePrompt || t.rsvp.leaveNote} className="ev-input resize-none" />
                  </label>
                )}
                {state.error && <p role="alert" className="text-sm font-semibold text-(--ev-accent)">{state.error}</p>}
                <button type="submit" disabled={pending || preview} className="ev-button w-full">
                  {preview ? t.rsvp.previewOff : pending ? t.rsvp.sending : mine ? t.rsvp.update : t.rsvp.send}
                </button>
              </form>
            )}
          </>
        )
      )}
    </section>
  );
}
