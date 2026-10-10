"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { deleteEvent, duplicateEvent, saveEvent, type EventInput } from "@/app/admin/actions";
import { EventPage } from "@/components/event/EventPage";
import { RsvpCard } from "@/components/event/RsvpCard";
import { hasEnded, rsvpClosedReason, type EventView, type GuestSummary } from "@/lib/event";
import { newSection, SECTION_TYPES, type Section, type SectionType } from "@/lib/sections";
import { EFFECTS, THEMES } from "@/lib/themes";
import { dateToZonedLocal, TIMEZONES, zonedLocalToDate } from "@/lib/time";
import { TITLE_FONTS } from "@/lib/title-fonts";
import { SectionEditor } from "./SectionEditor";
import { Card, Field, Input, Select, TextArea, Toggle } from "./ui";

type State = Omit<EventInput, "sections" | "rsvpSettings"> & {
  sections: Section[];
  rsvpSettings: EventView["rsvpSettings"];
  capacity: number | null;
  coverImageId: string | null;
  shareImageId: string | null;
  startsLocal: string | null;
  endsLocal: string | null;
};

function initialState(e: EventView): State {
  return {
    title: e.title,
    badge: e.badge,
    tagline: e.tagline,
    subtitle: e.subtitle,
    arrivalNote: e.arrivalNote,
    slug: e.slug,
    status: e.status,
    startsLocal: dateToZonedLocal(e.startsAt, e.timezone) || null,
    endsLocal: dateToZonedLocal(e.endsAt, e.timezone) || null,
    timezone: e.timezone,
    hostedBy: e.hostedBy,
    locationName: e.locationName,
    locationAddress: e.locationAddress,
    capacity: e.capacity,
    theme: e.theme,
    effect: e.effect,
    titleFont: e.titleFont,
    coverImageId: e.coverImageId,
    shareImageId: e.shareImageId,
    coverEmoji: e.coverEmoji,
    sections: e.sections,
    rsvpSettings: { ...e.rsvpSettings, deadline: dateToZonedLocal(e.rsvpSettings.deadline, e.timezone) || null },
  };
}

function toView(id: string, s: State): EventView {
  const iso = (local: string | null) => (local ? zonedLocalToDate(local, s.timezone)?.toISOString() ?? null : null);
  return {
    id,
    slug: s.slug,
    title: s.title,
    badge: s.badge,
    tagline: s.tagline,
    subtitle: s.subtitle,
    arrivalNote: s.arrivalNote,
    status: s.status,
    startsAt: iso(s.startsLocal),
    endsAt: iso(s.endsLocal),
    timezone: s.timezone,
    hostedBy: s.hostedBy,
    locationName: s.locationName,
    locationAddress: s.locationAddress,
    capacity: s.capacity,
    theme: s.theme,
    effect: s.effect,
    titleFont: s.titleFont,
    coverImageId: s.coverImageId,
    shareImageId: s.shareImageId,
    coverEmoji: s.coverEmoji,
    sections: s.sections,
    rsvpSettings: { ...s.rsvpSettings, deadline: iso(s.rsvpSettings.deadline) },
  };
}

const slugify = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/** Shrink photos in the browser before upload so the database stays small. */
async function resizeImage(file: File, max = 1600): Promise<Blob> {
  if (file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read image"))), "image/webp", 0.86));
}

export function EventEditor({ id, event, summary, origin }: { id: string; event: EventView; summary: GuestSummary; origin: string }) {
  const [state, setState] = useState<State>(() => initialState(event));
  const [saved, setSaved] = useState<State>(state);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, startSaving] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [adding, setAdding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const shareRef = useRef<HTMLInputElement>(null);
  const [sharing, setSharing] = useState(false);

  const dirty = JSON.stringify(state) !== JSON.stringify(saved);
  const view = useMemo(() => toView(id, state), [id, state]);
  const ended = hasEnded(view);
  const slugFromTitle = slugify(saved.title) === saved.slug;

  const set = <K extends keyof State>(key: K, value: State[K]) => setState((s) => ({ ...s, [key]: value }));
  const setRsvp = <K extends keyof State["rsvpSettings"]>(key: K, value: State["rsvpSettings"][K]) =>
    setState((s) => ({ ...s, rsvpSettings: { ...s.rsvpSettings, [key]: value } }));
  const setSections = (fn: (s: Section[]) => Section[]) => setState((s) => ({ ...s, sections: fn(s.sections) }));

  const save = () => {
    setError(null);
    startSaving(async () => {
      const res = await saveEvent(id, state);
      if (res.ok) {
        setSaved(state);
        setSavedAt(res.savedAt);
      } else {
        setError(res.error);
      }
    });
  };

  // ⌘S / Ctrl+S saves; warn before leaving with unsaved changes.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const uploadShare = async (file: File) => {
    setSharing(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", "share");
      const res = await fetch("/api/admin/images", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      set("shareImageId", json.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSharing(false);
      if (shareRef.current) shareRef.current.value = "";
    }
  };

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const blob = await resizeImage(file);
      const body = new FormData();
      body.append("file", new File([blob], "cover", { type: blob.type }));
      const res = await fetch("/api/admin/images", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      set("coverImageId", json.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const labels = state.rsvpSettings.labels;

  return (
    <div className="mx-auto max-w-[1600px]">
      {/* Toolbar */}
      <div className="sticky top-14 z-20 flex flex-wrap items-center gap-2 border-b border-line bg-sky-page/90 px-4 py-2.5 backdrop-blur-md sm:px-6">
        <Link href="/admin" className="mr-1 text-sm font-semibold whitespace-nowrap text-ink-soft hover:text-ink">← Parties</Link>
        <div className="flex rounded-full border border-line p-0.5 text-sm font-semibold lg:hidden" role="tablist">
          {(["edit", "preview"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-full px-3 py-1 capitalize ${tab === t ? "bg-ink text-paper" : "text-ink-soft"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-sm text-ink-soft sm:inline" aria-live="polite">
            {saving ? "Saving…" : dirty ? "Unsaved changes" : savedAt ? "Saved" : ""}
          </span>
          <Link href={`/admin/events/${id}/rsvps`} className="rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap hover:bg-paper-2">
            RSVPs ({summary.going})
          </Link>
          <a href={`/e/${saved.slug}`} target="_blank" className="rounded-full border border-line px-4 py-2 text-sm font-semibold whitespace-nowrap hover:bg-paper-2">
            View page ↗
          </a>
          <button onClick={save} disabled={saving || !dirty} className="rounded-full bg-rose-deep px-5 py-2 text-sm font-semibold whitespace-nowrap text-white transition hover:bg-rose active:translate-y-px disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mx-4 mt-3 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-semibold text-rose-deep sm:mx-6">{error}</p>
      )}

      <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,540px)_minmax(0,1fr)]">
        {/* Editor */}
        <div className={`space-y-4 ${tab === "preview" ? "hidden lg:block" : ""}`}>
          <Card
            title="Basics"
            aside={
              <div className="flex items-center gap-2 text-sm">
                <span className={`size-2 rounded-full ${state.status === "active" ? "bg-green-500" : "bg-ink/30"}`} aria-hidden />
                <Select aria-label="Status" value={state.status} onChange={(e) => set("status", e.target.value as State["status"])} className="w-auto py-1.5 text-sm">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            }
          >
            {ended && state.status === "active" && (
              <p className="rounded-2xl bg-butter px-3 py-2 text-sm">
                This date has passed, so the page will switch to inactive automatically. Change the date to keep it open.
              </p>
            )}
            <Field label="Title" hint="The first word sits on its own line; the rest is highlighted.">
              {(fid) => (
                <Input
                  id={fid}
                  value={state.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setState((s) => ({ ...s, title, slug: slugFromTitle || s.slug.startsWith("party-") ? slugify(title) || s.slug : s.slug }));
                  }}
                  className="text-lg font-semibold"
                />
              )}
            </Field>
            <Field label="Page link" hint="Share this with your guests. Anyone with the link can see the page, so avoid links that are easy to guess.">
              {(fid) => (
                <div className="flex items-center rounded-2xl border border-line bg-paper/60 focus-within:border-rose-deep">
                  <span className="pl-3.5 text-sm whitespace-nowrap text-ink-soft">/e/</span>
                  <input id={fid} value={state.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} className="w-full min-w-0 bg-transparent py-2.5 pr-3.5 pl-0.5 outline-none" />
                </div>
              )}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts">{(fid) => <Input id={fid} type="datetime-local" value={state.startsLocal ?? ""} onChange={(e) => set("startsLocal", e.target.value || null)} />}</Field>
              <Field label="Ends" hint="Optional">{(fid) => <Input id={fid} type="datetime-local" value={state.endsLocal ?? ""} onChange={(e) => set("endsLocal", e.target.value || null)} />}</Field>
            </div>
            <Field label="Time zone">
              {(fid) => (
                <Select id={fid} value={state.timezone} onChange={(e) => set("timezone", e.target.value)}>
                  {[...new Set([state.timezone, ...TIMEZONES])].map((tz) => (
                    <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Location name">{(fid) => <Input id={fid} placeholder="Grandma's backyard" value={state.locationName} onChange={(e) => set("locationName", e.target.value)} />}</Field>
            <Field label="Address">{(fid) => <Input id={fid} placeholder="123 Main St, Brooklyn, NY" value={state.locationAddress} onChange={(e) => set("locationAddress", e.target.value)} />}</Field>
            <Field label="Arrival instructions" hint="Shown under the party details.">
              {(fid) => <TextArea id={fid} rows={3} placeholder="Ask the doorman for…" value={state.arrivalNote} onChange={(e) => set("arrivalNote", e.target.value)} />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Hosted by">{(fid) => <Input id={fid} placeholder="Mom & Dad" value={state.hostedBy} onChange={(e) => set("hostedBy", e.target.value)} />}</Field>
              <Field label="Spots" hint="Leave empty for unlimited">
                {(fid) => (
                  <Input id={fid} type="number" min={1} inputMode="numeric" placeholder="Unlimited" value={state.capacity ?? ""} onChange={(e) => set("capacity", e.target.value ? Math.max(1, Number(e.target.value)) : null)} />
                )}
              </Field>
            </div>
          </Card>

          <Card title="Invitation">
            <Field label="Badge" hint="Optional pill above the title.">
              {(fid) => <Input id={fid} placeholder="A pop star birthday" value={state.badge} onChange={(e) => set("badge", e.target.value)} />}
            </Field>
            <Field label="Tagline" hint="One line under the title.">
              {(fid) => <Input id={fid} placeholder="The birthday concert of the year" value={state.tagline} onChange={(e) => set("tagline", e.target.value)} />}
            </Field>
            <Field label="Intro" hint="A short note in a card above the details. Leave a blank line between paragraphs.">
              {(fid) => <TextArea id={fid} rows={4} placeholder="Join us for…" value={state.subtitle} onChange={(e) => set("subtitle", e.target.value)} />}
            </Field>
          </Card>

          <Card title="Link preview">
            <p className="text-sm text-ink-soft">
              The picture that shows when the link is shared in WhatsApp, iMessage and other apps. No picture is shown until you add one.
              We size it to 1200 × 630 automatically; a wide image around that shape looks best.
            </p>
            <div className="flex flex-wrap items-start gap-4">
              {state.shareImageId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/images/${state.shareImageId}`} alt="Link preview image" className="aspect-[1200/630] w-56 rounded-xl border border-line object-cover" />
              ) : (
                <div className="grid aspect-[1200/630] w-56 place-items-center rounded-xl border border-dashed border-line text-xs text-ink-soft">No image</div>
              )}
              <div className="space-y-2">
                <input ref={shareRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => e.target.files?.[0] && uploadShare(e.target.files[0])} />
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={sharing} onClick={() => shareRef.current?.click()} className="rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap hover:bg-paper-2 disabled:opacity-50">
                    {sharing ? "Uploading…" : state.shareImageId ? "Replace image" : "Upload image"}
                  </button>
                  {state.shareImageId && (
                    <button type="button" onClick={() => set("shareImageId", null)} className="rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-ink-soft hover:bg-paper-2">
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-ink-soft">JPG, PNG, WebP or GIF, up to 5 MB. Apps cache previews, so a new image can take a while to show on links already shared.</p>
              </div>
            </div>
          </Card>

          <Card title="Look & feel">
            <div>
              <p className="mb-2 text-sm font-semibold">Theme</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set("theme", key)}
                    aria-pressed={state.theme === key}
                    className={`overflow-hidden rounded-2xl border text-left transition ${state.theme === key ? "border-ink ring-2 ring-ink" : "border-line hover:border-ink/40"}`}
                  >
                    <span className="block h-12" style={{ background: t.bg }}>
                      <span className="flex h-full items-end gap-1 p-1.5">
                        <span className="size-3 rounded-full" style={{ background: t.accent }} />
                        <span className="size-3 rounded-full" style={{ background: t.ink }} />
                      </span>
                    </span>
                    <span className="block truncate px-2 py-1.5 text-xs font-semibold">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Title style</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TITLE_FONTS).map(([key, f]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set("titleFont", key)}
                    aria-pressed={state.titleFont === key}
                    style={{ fontFamily: f.family, fontVariationSettings: f.settings, fontWeight: f.weight }}
                    className={`rounded-full border px-4 py-1.5 text-lg whitespace-nowrap ${state.titleFont === key ? "border-ink bg-ink text-paper" : "border-line hover:bg-paper-2"}`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Effect</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(EFFECTS).map(([key, name]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set("effect", key)}
                    aria-pressed={state.effect === key}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap ${state.effect === key ? "border-ink bg-ink text-paper" : "border-line hover:bg-paper-2"}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Image</p>
              <div className="flex items-center gap-4">
                <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line text-4xl" style={{ background: THEMES[state.theme as keyof typeof THEMES]?.cover }}>
                  {state.coverImageId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/images/${state.coverImageId}`} alt="" className="size-full object-contain" />
                  ) : (
                    state.coverEmoji
                  )}
                </div>
                <div className="min-w-0 space-y-2">
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap hover:bg-paper-2 disabled:opacity-50">
                      {uploading ? "Uploading…" : state.coverImageId ? "Replace image" : "Upload image"}
                    </button>
                    {state.coverImageId && (
                      <button type="button" onClick={() => set("coverImageId", null)} className="rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-ink-soft hover:bg-paper-2">
                        Use emoji instead
                      </button>
                    )}
                  </div>
                  {!state.coverImageId && (
                    <label className="flex items-center gap-2 text-sm">
                      <span className="text-ink-soft">Emoji</span>
                      <Input value={state.coverEmoji} maxLength={16} onChange={(e) => set("coverEmoji", e.target.value)} className="w-20 py-1.5 text-center text-lg" />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Sections">
            <p className="text-sm text-ink-soft">Reorder, hide, or add blocks to the page. Tap a section to edit it.</p>
            <ul className="space-y-2">
              {state.sections.map((s, i) => (
                <SectionEditor
                  key={s.id}
                  section={s}
                  index={i}
                  count={state.sections.length}
                  onChange={(next) => setSections((all) => all.map((x) => (x.id === s.id ? next : x)))}
                  onMove={(dir) =>
                    setSections((all) => {
                      const copy = [...all];
                      [copy[i], copy[i + dir]] = [copy[i + dir], copy[i]];
                      return copy;
                    })
                  }
                  onRemove={() => setSections((all) => all.filter((x) => x.id !== s.id))}
                />
              ))}
            </ul>
            {adding ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(Object.keys(SECTION_TYPES) as SectionType[])
                  .filter((t) => t !== "details" || !state.sections.some((s) => s.type === "details"))
                  .filter((t) => t !== "guests" || !state.sections.some((s) => s.type === "guests"))
                  .map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setSections((all) => [...all, newSection(t)]);
                        setAdding(false);
                      }}
                      className="rounded-2xl border border-line p-3 text-left hover:bg-paper-2"
                    >
                      <span className="text-xl">{SECTION_TYPES[t].emoji}</span>
                      <span className="mt-1 block text-sm font-semibold">{SECTION_TYPES[t].label}</span>
                      <span className="block text-xs text-ink-soft">{SECTION_TYPES[t].hint}</span>
                    </button>
                  ))}
                <button type="button" onClick={() => setAdding(false)} className="rounded-2xl p-3 text-sm font-semibold text-ink-soft hover:bg-paper-2">Cancel</button>
              </div>
            ) : (
              <button type="button" onClick={() => setAdding(true)} className="w-full rounded-2xl border border-dashed border-line py-3 text-sm font-semibold text-rose-deep hover:bg-paper-2">
                + Add a section
              </button>
            )}
          </Card>

          <Card title="RSVP" defaultOpen={false}>
            <Toggle label="Ask how many adults & kids" checked={state.rsvpSettings.askCounts} onChange={(v) => setRsvp("askCounts", v)} />
            <Toggle label="Ask for email and phone" checked={state.rsvpSettings.askContact} onChange={(v) => setRsvp("askContact", v)} />
            {state.rsvpSettings.askContact && (
              <Toggle label="Require an email or phone" hint="Guests can't RSVP yes or maybe without at least one." checked={state.rsvpSettings.contactRequired} onChange={(v) => setRsvp("contactRequired", v)} />
            )}
            <Toggle label="Let guests leave a note" checked={state.rsvpSettings.askNote} onChange={(v) => setRsvp("askNote", v)} />
            {state.rsvpSettings.askNote && (
              <Field label="Note prompt">{(fid) => <Input id={fid} value={state.rsvpSettings.notePrompt} onChange={(e) => setRsvp("notePrompt", e.target.value)} />}</Field>
            )}
            <Field label="RSVP by" hint="Optional. RSVPs close after this time.">
              {(fid) => <Input id={fid} type="datetime-local" value={state.rsvpSettings.deadline ?? ""} onChange={(e) => setRsvp("deadline", e.target.value || null)} />}
            </Field>
            <div>
              <p className="mb-2 text-sm font-semibold">Button labels</p>
              <div className="space-y-2">
                {(["going", "maybe", "no"] as const).map((k) => (
                  <div key={k} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                    <Input aria-label={`${k} emoji`} value={labels[k].emoji} maxLength={16} className="text-center text-lg" onChange={(e) => setRsvp("labels", { ...labels, [k]: { ...labels[k], emoji: e.target.value } })} />
                    <Input aria-label={`${k} label`} value={labels[k].text} maxLength={30} onChange={(e) => setRsvp("labels", { ...labels, [k]: { ...labels[k], text: e.target.value } })} />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="More" defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              <form action={duplicateEvent.bind(null, id)}>
                <button className="rounded-full border border-line px-4 py-2 text-sm font-semibold whitespace-nowrap hover:bg-paper-2">Duplicate as a new party</button>
              </form>
              <form
                action={deleteEvent.bind(null, id)}
                onSubmit={(e) => {
                  if (!confirm(`Delete "${saved.title}" and all of its RSVPs? This can't be undone.`)) e.preventDefault();
                }}
              >
                <button className="rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap text-rose-deep hover:bg-rose/10">Delete party</button>
              </form>
            </div>
            <TextArea readOnly aria-label="Share message" rows={2} value={`You're invited to ${state.title}! RSVP here: ${origin}/e/${saved.slug}`} className="text-sm" />
          </Card>
        </div>

        {/* Live preview */}
        <div className={`${tab === "edit" ? "hidden lg:block" : ""}`}>
          <div className="sticky top-[7.5rem] h-[calc(100dvh-8.5rem)] overflow-y-auto rounded-[2rem] border border-line shadow-[0_30px_80px_-60px_rgb(0_0_0/0.6)]">
            <EventPage
              contained
              event={view}
              summary={summary}
              rsvp={<RsvpCard preview slug={view.slug} settings={view.rsvpSettings} mine={null} closedReason={rsvpClosedReason(view)} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
