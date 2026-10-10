"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { deleteEvent, duplicateEvent, saveEvent, type EventInput } from "@/app/admin/actions";
import { EventPage } from "@/components/event/EventPage";
import { RsvpCard } from "@/components/event/RsvpCard";
import { hasEnded, rsvpClosedReason, type EventView, type GuestSummary } from "@/lib/event";
import { getDict, isAutoSlug, type Lang } from "@/lib/i18n";
import { newSection, SECTION_TYPES, type Section, type SectionType } from "@/lib/sections";
import { EFFECTS, THEMES, type ThemeKey } from "@/lib/themes";
import { dateToZonedLocal, TIMEZONES, zonedLocalToDate } from "@/lib/time";
import { TITLE_FONTS, type TitleFontKey } from "@/lib/title-fonts";
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
async function resizeImage(file: File, unreadable: string, max = 1600): Promise<Blob> {
  if (file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(unreadable))), "image/webp", 0.86));
}

export function EventEditor({ id, event, summary, origin, lang }: { id: string; event: EventView; summary: GuestSummary; origin: string; lang: Lang }) {
  const t = getDict(lang);
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
      if (!res.ok) throw new Error(json.error ?? t.editor.uploadFailed);
      set("shareImageId", json.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.editor.uploadFailed);
    } finally {
      setSharing(false);
      if (shareRef.current) shareRef.current.value = "";
    }
  };

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const blob = await resizeImage(file, t.editor.unreadableImage);
      const body = new FormData();
      body.append("file", new File([blob], "cover", { type: blob.type }));
      const res = await fetch("/api/admin/images", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t.editor.uploadFailed);
      set("coverImageId", json.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.editor.uploadFailed);
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
        <Link href="/admin" className="mr-1 text-sm font-semibold whitespace-nowrap text-ink-soft hover:text-ink">{t.editor.back}</Link>
        <div className="flex rounded-full border border-line p-0.5 text-sm font-semibold lg:hidden" role="tablist">
          {(["edit", "preview"] as const).map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full px-3 py-1 ${tab === k ? "bg-ink text-paper" : "text-ink-soft"}`}>
              {t.editor.tabs[k]}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-sm text-ink-soft sm:inline" aria-live="polite">
            {saving ? t.editor.saving : dirty ? t.editor.unsaved : savedAt ? t.editor.saved : ""}
          </span>
          <Link href={`/admin/events/${id}/rsvps`} className="rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap hover:bg-paper-2">
            {t.editor.rsvps(summary.going)}
          </Link>
          <a href={`/e/${saved.slug}`} target="_blank" className="rounded-full border border-line px-4 py-2 text-sm font-semibold whitespace-nowrap hover:bg-paper-2">
            {t.editor.viewPage}
          </a>
          <button onClick={save} disabled={saving || !dirty} className="rounded-full bg-rose-deep px-5 py-2 text-sm font-semibold whitespace-nowrap text-white transition hover:bg-rose active:translate-y-px disabled:opacity-50">
            {saving ? t.editor.saving : t.editor.save}
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
            title={t.editor.basics}
            aside={
              <div className="flex items-center gap-2 text-sm">
                <span className={`size-2 rounded-full ${state.status === "active" ? "bg-green-500" : "bg-ink/30"}`} aria-hidden />
                <Select aria-label={t.editor.status} value={state.status} onChange={(e) => set("status", e.target.value as State["status"])} className="w-auto py-1.5 text-sm">
                  <option value="active">{t.editor.active}</option>
                  <option value="inactive">{t.editor.inactive}</option>
                </Select>
              </div>
            }
          >
            {ended && state.status === "active" && (
              <p className="rounded-2xl bg-butter px-3 py-2 text-sm">
                {t.editor.passed}
              </p>
            )}
            <Field label={t.editor.title} hint={t.editor.titleHint}>
              {(fid) => (
                <Input
                  id={fid}
                  value={state.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setState((s) => ({ ...s, title, slug: slugFromTitle || isAutoSlug(s.slug) ? slugify(title) || s.slug : s.slug }));
                  }}
                  className="text-lg font-semibold"
                />
              )}
            </Field>
            <Field label={t.editor.slug} hint={t.editor.slugHint}>
              {(fid) => (
                <div className="flex items-center rounded-2xl border border-line bg-paper/60 focus-within:border-rose-deep">
                  <span className="pl-3.5 text-sm whitespace-nowrap text-ink-soft">/e/</span>
                  <input id={fid} value={state.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} className="w-full min-w-0 bg-transparent py-2.5 pr-3.5 pl-0.5 outline-none" />
                </div>
              )}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.editor.starts}>{(fid) => <Input id={fid} type="datetime-local" value={state.startsLocal ?? ""} onChange={(e) => set("startsLocal", e.target.value || null)} />}</Field>
              <Field label={t.editor.ends} hint={t.editor.optional}>{(fid) => <Input id={fid} type="datetime-local" value={state.endsLocal ?? ""} onChange={(e) => set("endsLocal", e.target.value || null)} />}</Field>
            </div>
            <Field label={t.editor.timezone}>
              {(fid) => (
                <Select id={fid} value={state.timezone} onChange={(e) => set("timezone", e.target.value)}>
                  {[...new Set([state.timezone, ...TIMEZONES])].map((tz) => (
                    <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t.editor.locationName}>{(fid) => <Input id={fid} placeholder={t.editor.locationNamePlaceholder} value={state.locationName} onChange={(e) => set("locationName", e.target.value)} />}</Field>
            <Field label={t.editor.address}>{(fid) => <Input id={fid} placeholder={t.editor.addressPlaceholder} value={state.locationAddress} onChange={(e) => set("locationAddress", e.target.value)} />}</Field>
            <Field label={t.editor.arrival} hint={t.editor.arrivalHint}>
              {(fid) => <TextArea id={fid} rows={3} placeholder={t.editor.arrivalPlaceholder} value={state.arrivalNote} onChange={(e) => set("arrivalNote", e.target.value)} />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.editor.hostedBy}>{(fid) => <Input id={fid} placeholder={t.editor.hostedByPlaceholder} value={state.hostedBy} onChange={(e) => set("hostedBy", e.target.value)} />}</Field>
              <Field label={t.editor.spots} hint={t.editor.spotsHint}>
                {(fid) => (
                  <Input id={fid} type="number" min={1} inputMode="numeric" placeholder={t.editor.unlimited} value={state.capacity ?? ""} onChange={(e) => set("capacity", e.target.value ? Math.max(1, Number(e.target.value)) : null)} />
                )}
              </Field>
            </div>
          </Card>

          <Card title={t.editor.invitation}>
            <Field label={t.editor.badge} hint={t.editor.badgeHint}>
              {(fid) => <Input id={fid} placeholder={t.editor.badgePlaceholder} value={state.badge} onChange={(e) => set("badge", e.target.value)} />}
            </Field>
            <Field label={t.editor.tagline} hint={t.editor.taglineHint}>
              {(fid) => <Input id={fid} placeholder={t.editor.taglinePlaceholder} value={state.tagline} onChange={(e) => set("tagline", e.target.value)} />}
            </Field>
            <Field label={t.editor.intro} hint={t.editor.introHint}>
              {(fid) => <TextArea id={fid} rows={4} placeholder={t.editor.introPlaceholder} value={state.subtitle} onChange={(e) => set("subtitle", e.target.value)} />}
            </Field>
          </Card>

          <Card title={t.editor.linkPreview}>
            <p className="text-sm text-ink-soft">{t.editor.linkPreviewAbout}</p>
            <div className="flex flex-wrap items-start gap-4">
              {state.shareImageId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/images/${state.shareImageId}`} alt={t.editor.linkPreviewAlt} className="aspect-[1200/630] w-56 rounded-xl border border-line object-cover" />
              ) : (
                <div className="grid aspect-[1200/630] w-56 place-items-center rounded-xl border border-dashed border-line text-xs text-ink-soft">{t.editor.noImage}</div>
              )}
              <div className="space-y-2">
                <input ref={shareRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => e.target.files?.[0] && uploadShare(e.target.files[0])} />
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={sharing} onClick={() => shareRef.current?.click()} className="rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap hover:bg-paper-2 disabled:opacity-50">
                    {sharing ? t.editor.uploading : state.shareImageId ? t.editor.replaceImage : t.editor.uploadImage}
                  </button>
                  {state.shareImageId && (
                    <button type="button" onClick={() => set("shareImageId", null)} className="rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-ink-soft hover:bg-paper-2">
                      {t.editor.remove}
                    </button>
                  )}
                </div>
                <p className="text-xs text-ink-soft">{t.editor.linkPreviewFormats}</p>
              </div>
            </div>
          </Card>

          <Card title={t.editor.look}>
            <div>
              <p className="mb-2 text-sm font-semibold">{t.editor.theme}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set("theme", key)}
                    aria-pressed={state.theme === key}
                    className={`overflow-hidden rounded-2xl border text-left transition ${state.theme === key ? "border-ink ring-2 ring-ink" : "border-line hover:border-ink/40"}`}
                  >
                    <span className="block h-12" style={{ background: theme.bg }}>
                      <span className="flex h-full items-end gap-1 p-1.5">
                        <span className="size-3 rounded-full" style={{ background: theme.accent }} />
                        <span className="size-3 rounded-full" style={{ background: theme.ink }} />
                      </span>
                    </span>
                    <span className="block truncate px-2 py-1.5 text-xs font-semibold">{t.themes[key as ThemeKey]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">{t.editor.titleStyle}</p>
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
                    {t.titleFonts[key as TitleFontKey]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">{t.editor.effect}</p>
              <div className="flex flex-wrap gap-2">
                {EFFECTS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set("effect", key)}
                    aria-pressed={state.effect === key}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap ${state.effect === key ? "border-ink bg-ink text-paper" : "border-line hover:bg-paper-2"}`}
                  >
                    {t.effects[key]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">{t.editor.image}</p>
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
                      {uploading ? t.editor.uploading : state.coverImageId ? t.editor.replaceImage : t.editor.uploadImage}
                    </button>
                    {state.coverImageId && (
                      <button type="button" onClick={() => set("coverImageId", null)} className="rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-ink-soft hover:bg-paper-2">
                        {t.editor.useEmoji}
                      </button>
                    )}
                  </div>
                  {!state.coverImageId && (
                    <label className="flex items-center gap-2 text-sm">
                      <span className="text-ink-soft">{t.editor.emoji}</span>
                      <Input value={state.coverEmoji} maxLength={16} onChange={(e) => set("coverEmoji", e.target.value)} className="w-20 py-1.5 text-center text-lg" />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card title={t.editor.sections}>
            <p className="text-sm text-ink-soft">{t.editor.sectionsAbout}</p>
            <ul className="space-y-2">
              {state.sections.map((s, i) => (
                <SectionEditor
                  key={s.id}
                  section={s}
                  index={i}
                  count={state.sections.length}
                  t={t}
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
                  .filter((type) => type !== "details" || !state.sections.some((s) => s.type === "details"))
                  .filter((type) => type !== "guests" || !state.sections.some((s) => s.type === "guests"))
                  .map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSections((all) => [...all, newSection(type, t)]);
                        setAdding(false);
                      }}
                      className="rounded-2xl border border-line p-3 text-left hover:bg-paper-2"
                    >
                      <span className="text-xl">{SECTION_TYPES[type].emoji}</span>
                      <span className="mt-1 block text-sm font-semibold">{t.sectionTypes[type].label}</span>
                      <span className="block text-xs text-ink-soft">{t.sectionTypes[type].hint}</span>
                    </button>
                  ))}
                <button type="button" onClick={() => setAdding(false)} className="rounded-2xl p-3 text-sm font-semibold text-ink-soft hover:bg-paper-2">{t.editor.cancel}</button>
              </div>
            ) : (
              <button type="button" onClick={() => setAdding(true)} className="w-full rounded-2xl border border-dashed border-line py-3 text-sm font-semibold text-rose-deep hover:bg-paper-2">
                {t.editor.addSection}
              </button>
            )}
          </Card>

          <Card title={t.editor.rsvp} defaultOpen={false}>
            <Toggle label={t.editor.askCounts} checked={state.rsvpSettings.askCounts} onChange={(v) => setRsvp("askCounts", v)} />
            <Toggle label={t.editor.askContact} checked={state.rsvpSettings.askContact} onChange={(v) => setRsvp("askContact", v)} />
            {state.rsvpSettings.askContact && (
              <Toggle label={t.editor.contactRequired} hint={t.editor.contactRequiredHint} checked={state.rsvpSettings.contactRequired} onChange={(v) => setRsvp("contactRequired", v)} />
            )}
            <Toggle label={t.editor.askNote} checked={state.rsvpSettings.askNote} onChange={(v) => setRsvp("askNote", v)} />
            {state.rsvpSettings.askNote && (
              <Field label={t.editor.notePrompt}>{(fid) => <Input id={fid} value={state.rsvpSettings.notePrompt} onChange={(e) => setRsvp("notePrompt", e.target.value)} />}</Field>
            )}
            <Field label={t.editor.deadline} hint={t.editor.deadlineHint}>
              {(fid) => <Input id={fid} type="datetime-local" value={state.rsvpSettings.deadline ?? ""} onChange={(e) => setRsvp("deadline", e.target.value || null)} />}
            </Field>
            <div>
              <p className="mb-2 text-sm font-semibold">{t.editor.buttonLabels}</p>
              <div className="space-y-2">
                {(["going", "maybe", "no"] as const).map((k) => (
                  <div key={k} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                    <Input aria-label={t.editor.buttonEmoji(t.defaults.labels[k])} value={labels[k].emoji} maxLength={16} className="text-center text-lg" onChange={(e) => setRsvp("labels", { ...labels, [k]: { ...labels[k], emoji: e.target.value } })} />
                    <Input aria-label={t.editor.buttonText(t.defaults.labels[k])} value={labels[k].text} maxLength={30} onChange={(e) => setRsvp("labels", { ...labels, [k]: { ...labels[k], text: e.target.value } })} />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title={t.editor.more} defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              <form action={duplicateEvent.bind(null, id)}>
                <button className="rounded-full border border-line px-4 py-2 text-sm font-semibold whitespace-nowrap hover:bg-paper-2">{t.editor.duplicate}</button>
              </form>
              <form
                action={deleteEvent.bind(null, id)}
                onSubmit={(e) => {
                  if (!confirm(t.editor.confirmDelete(saved.title))) e.preventDefault();
                }}
              >
                <button className="rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap text-rose-deep hover:bg-rose/10">{t.editor.delete}</button>
              </form>
            </div>
            <TextArea readOnly aria-label={t.editor.shareMessageLabel} rows={2} value={t.editor.shareMessage(state.title, `${origin}/e/${saved.slug}`)} className="text-sm" />
          </Card>
        </div>

        {/* Live preview */}
        <div className={`${tab === "edit" ? "hidden lg:block" : ""}`}>
          <div className="sticky top-[7.5rem] h-[calc(100dvh-8.5rem)] overflow-y-auto rounded-[2rem] border border-line shadow-[0_30px_80px_-60px_rgb(0_0_0/0.6)]">
            <EventPage
              contained
              event={view}
              summary={summary}
              lang={lang}
              rsvp={<RsvpCard preview slug={view.slug} settings={view.rsvpSettings} mine={null} closedReason={rsvpClosedReason(view, t)} lang={lang} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
