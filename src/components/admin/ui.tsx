"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

export function Card({ title, children, defaultOpen = true, aside }: { title: string; children: ReactNode; defaultOpen?: boolean; aside?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-3xl border border-line bg-white/70">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex flex-1 items-center gap-2 text-left">
          <span aria-hidden className={`text-ink-soft transition-transform ${open ? "rotate-90" : ""}`}>›</span>
          <h2 className="font-display text-xl font-medium [font-variation-settings:'SOFT'_100]">{title}</h2>
        </button>
        {aside}
      </div>
      {open && <div className="space-y-4 border-t border-line px-5 pt-4 pb-5">{children}</div>}
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">{label}</label>
      {children(id)}
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full min-w-0 rounded-2xl border border-line bg-paper/60 px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink-soft/60 focus-visible:border-rose-deep focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-rose-deep/40";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function TextArea(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={`${inputCls} min-h-24 resize-y leading-relaxed ${props.className ?? ""}`} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={`${inputCls} appearance-auto ${props.className ?? ""}`} />;
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-ink-soft">{hint}</span>}
      </span>
      <Switch checked={checked} onChange={onChange} label={label} />
    </label>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? "bg-rose-deep" : "bg-ink/20"}`}
    >
      <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
    </button>
  );
}

export function IconButton({ label, children, ...props }: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={`grid size-8 place-items-center rounded-full text-ink-soft hover:bg-paper-2 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}
