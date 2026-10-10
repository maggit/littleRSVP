"use client";

import { useState } from "react";
import { SECTION_TYPES, type Section } from "@/lib/sections";
import { Field, IconButton, Input, Switch, TextArea } from "./ui";

type Props = {
  section: Section;
  index: number;
  count: number;
  onChange: (s: Section) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
};

function summary(s: Section) {
  if ("title" in s && s.title) return s.title;
  if (s.type === "text") return s.body.slice(0, 60) || "Empty";
  return SECTION_TYPES[s.type].hint;
}

export function SectionEditor({ section, index, count, onChange, onMove, onRemove }: Props) {
  const [open, setOpen] = useState(false);
  const meta = SECTION_TYPES[section.type];
  const editable = section.type !== "details";

  return (
    <li className={`rounded-2xl border border-line bg-paper/50 ${section.enabled ? "" : "opacity-60"}`}>
      <div className="flex items-center gap-2 py-2 pr-2 pl-3">
        <button type="button" disabled={!editable} onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default">
          <span className="text-xl" aria-hidden>{meta.emoji}</span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{meta.label}</span>
            <span className="block truncate text-xs text-ink-soft">{summary(section)}</span>
          </span>
        </button>
        <IconButton label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>↑</IconButton>
        <IconButton label="Move down" disabled={index === count - 1} onClick={() => onMove(1)}>↓</IconButton>
        <Switch checked={section.enabled} onChange={(enabled) => onChange({ ...section, enabled })} label={`Show ${meta.label}`} />
      </div>
      {open && editable && (
        <div className="space-y-3 border-t border-line p-3">
          <Fields section={section} onChange={onChange} />
          <div className="flex justify-end">
            <button type="button" onClick={onRemove} className="rounded-full px-3 py-1 text-xs font-semibold text-ink-soft hover:bg-rose/10 hover:text-rose-deep">
              Remove section
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function Fields({ section: s, onChange }: { section: Section; onChange: (s: Section) => void }) {
  switch (s.type) {
    case "details":
      return null;
    case "text":
      return (
        <>
          <Field label="Heading" hint="Optional">{(id) => <Input id={id} value={s.title} onChange={(e) => onChange({ ...s, title: e.target.value })} />}</Field>
          <Field label="Text" hint="Leave a blank line between paragraphs.">{(id) => <TextArea id={id} rows={5} value={s.body} onChange={(e) => onChange({ ...s, body: e.target.value })} />}</Field>
        </>
      );
    case "callout":
      return (
        <>
          <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
            <Field label="Emoji">{(id) => <Input id={id} value={s.emoji} maxLength={16} className="text-center text-xl" onChange={(e) => onChange({ ...s, emoji: e.target.value })} />}</Field>
            <Field label="Heading">{(id) => <Input id={id} value={s.title} onChange={(e) => onChange({ ...s, title: e.target.value })} />}</Field>
          </div>
          <Field label="Text">{(id) => <TextArea id={id} rows={3} value={s.body} onChange={(e) => onChange({ ...s, body: e.target.value })} />}</Field>
        </>
      );
    case "guests":
      return <Field label="Heading">{(id) => <Input id={id} value={s.title} onChange={(e) => onChange({ ...s, title: e.target.value })} />}</Field>;
    case "schedule":
      return (
        <ListFields
          title={s.title}
          onTitle={(title) => onChange({ ...s, title })}
          items={s.items}
          onItems={(items) => onChange({ ...s, items })}
          blank={{ time: "", label: "" }}
          addLabel="Add a time"
          render={(item, set) => (
            <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2">
              <Input aria-label="Time" placeholder="3:00" value={item.time} onChange={(e) => set({ ...item, time: e.target.value })} />
              <Input aria-label="What happens" placeholder="Cake!" value={item.label} onChange={(e) => set({ ...item, label: e.target.value })} />
            </div>
          )}
        />
      );
    case "links":
      return (
        <ListFields
          title={s.title}
          onTitle={(title) => onChange({ ...s, title })}
          items={s.items}
          onItems={(items) => onChange({ ...s, items })}
          blank={{ label: "", url: "" }}
          addLabel="Add a link"
          render={(item, set) => (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <Input aria-label="Label" placeholder="Wish list" value={item.label} onChange={(e) => set({ ...item, label: e.target.value })} />
              <Input aria-label="URL" placeholder="https://…" inputMode="url" value={item.url} onChange={(e) => set({ ...item, url: e.target.value })} />
            </div>
          )}
        />
      );
    case "faq":
      return (
        <ListFields
          title={s.title}
          onTitle={(title) => onChange({ ...s, title })}
          items={s.items}
          onItems={(items) => onChange({ ...s, items })}
          blank={{ q: "", a: "" }}
          addLabel="Add a question"
          render={(item, set) => (
            <div className="grid gap-2">
              <Input aria-label="Question" placeholder="Is there parking?" value={item.q} onChange={(e) => set({ ...item, q: e.target.value })} />
              <TextArea aria-label="Answer" rows={2} className="min-h-0" placeholder="Yes, on the street." value={item.a} onChange={(e) => set({ ...item, a: e.target.value })} />
            </div>
          )}
        />
      );
  }
}

function ListFields<T>({
  title,
  onTitle,
  items,
  onItems,
  blank,
  addLabel,
  render,
}: {
  title: string;
  onTitle: (t: string) => void;
  items: T[];
  onItems: (items: T[]) => void;
  blank: T;
  addLabel: string;
  render: (item: T, set: (item: T) => void) => React.ReactNode;
}) {
  return (
    <>
      <Field label="Heading">{(id) => <Input id={id} value={title} onChange={(e) => onTitle(e.target.value)} />}</Field>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1">
            <div className="min-w-0 flex-1">{render(item, (next) => onItems(items.map((x, j) => (j === i ? next : x))))}</div>
            <IconButton label="Remove" className="mt-1.5" onClick={() => onItems(items.filter((_, j) => j !== i))}>×</IconButton>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => onItems([...items, { ...blank }])} className="text-sm font-semibold text-rose-deep hover:underline">
        + {addLabel}
      </button>
    </>
  );
}
