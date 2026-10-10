"use client";

import { useActionState, useState } from "react";
import { submitRsvp, type RsvpState } from "@/app/e/[slug]/actions";
import type { MyRsvp } from "@/lib/event";
import type { RsvpSettings } from "@/lib/sections";

type Status = "going" | "maybe" | "no";

const STATUSES: Status[] = ["going", "maybe", "no"];

const HEADLINE: Record<Status, string> = { going: "You're going!", maybe: "You're a maybe", no: "You can't make it" };

function Stepper({ name, label, value, onChange, min = 0 }: { name: string; label: string; value: number; onChange: (n: number) => void; min?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-(--ev-line) px-4 py-2.5">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="ev-step">−</button>
        <output className="w-5 text-center font-semibold tabular-nums">{value}</output>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= 20} onClick={() => onChange(value + 1)} className="ev-step">+</button>
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
  preview = false,
}: {
  slug: string;
  settings: RsvpSettings;
  mine: MyRsvp;
  closedReason: string | null;
  preview?: boolean;
}) {
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
          <h2 id="rsvp-title" className="ev-heading mt-3 text-2xl">{HEADLINE[mine.status]}</h2>
          <p className="mt-1 text-(--ev-muted)">
            {mine.name}
            {mine.status !== "no" && settings.askCounts && ` · ${mine.adults} adult${mine.adults === 1 ? "" : "s"}${mine.kids ? `, ${mine.kids} kid${mine.kids === 1 ? "" : "s"}` : ""}`}
          </p>
          {!closedReason && (
            <button type="button" onClick={() => choose(mine.status)} className="ev-link mt-4 text-sm font-semibold">
              Change RSVP
            </button>
          )}
        </div>
      ) : (
        <h2 id="rsvp-title" className="ev-heading mb-5 text-center text-2xl">{closedReason ? "RSVP" : "Will you be there?"}</h2>
      )}

      {closedReason ? (
        <p className="mt-2 text-center text-(--ev-muted)">{closedReason}</p>
      ) : (
        (!mine || editing) && (
          <>
            <div role="radiogroup" aria-label="Your answer" className="grid grid-cols-3 gap-3">
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
                  <span className="sr-only">Your name</span>
                  <input name="name" required maxLength={80} defaultValue={mine?.name} placeholder="Your name" autoComplete="name" className="ev-input" />
                </label>
                {settings.askCounts && status !== "no" && (
                  <>
                    <Stepper name="adults" label="Adults" value={adults} onChange={setAdults} />
                    <Stepper name="kids" label="Kids" value={kids} onChange={setKids} />
                  </>
                )}
                {settings.askContact && status !== "no" && (
                  <>
                    <label className="block">
                      <span className="sr-only">Email</span>
                      <input name="email" type="email" maxLength={200} defaultValue={mine?.email} placeholder="Email" autoComplete="email" className="ev-input" />
                    </label>
                    <label className="block">
                      <span className="sr-only">Phone</span>
                      <input name="phone" type="tel" maxLength={40} defaultValue={mine?.phone} placeholder="Phone" autoComplete="tel" className="ev-input" />
                    </label>
                    <p className="text-xs text-(--ev-muted)">
                      {settings.contactRequired ? "Add an email, a phone number, or both, so we can send updates." : "Optional. Add an email, a phone number, or both, in case of updates."}
                    </p>
                  </>
                )}
                {settings.askNote && (
                  <label className="block">
                    <span className="sr-only">{settings.notePrompt || "Note"}</span>
                    <textarea name="note" rows={2} maxLength={1000} defaultValue={mine?.note} placeholder={settings.notePrompt || "Leave a note"} className="ev-input resize-none" />
                  </label>
                )}
                {state.error && <p role="alert" className="text-sm font-semibold text-(--ev-accent)">{state.error}</p>}
                <button type="submit" disabled={pending || preview} className="ev-button w-full">
                  {preview ? "RSVPs are off in preview" : pending ? "Sending…" : mine ? "Update RSVP" : "Send RSVP"}
                </button>
              </form>
            )}
          </>
        )
      )}
    </section>
  );
}
