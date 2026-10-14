"use client";

import { useEffect, useId, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

export function Select({
  value,
  onChange,
  options,
  placeholder = "Seleccione…",
  disabled,
  className = "",
  required,
  name,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  name?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <div ref={root} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value} required={required} />}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setOpen((v) => !v);
        }}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-[#fffdf8] px-3 py-2.5 text-left text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition ${
          disabled
            ? "cursor-not-allowed border-[#e6dcc8] text-[#9aa89c]"
            : open
              ? "border-[#c4a35a] ring-2 ring-[#c4a35a]/40"
              : "border-[#d9c9a3] hover:border-[#c4a35a]"
        }`}
      >
        <span className={selected ? "font-medium text-[#6a0938]" : "text-[#7a8a7e]"}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 text-[#6a0938] transition ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[#e6dcc8] bg-[#fffdf8] py-1 shadow-xl shadow-[#6a0938]/10"
        >
          {options.length === 0 && (
            <li className="px-3 py-2 text-sm text-[#7a8a7e]">Sin opciones</li>
          )}
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition ${
                    active ? "bg-[#6a0938] text-white" : "text-[#6a0938] hover:bg-[#f4efe3]"
                  }`}
                  onClick={(e) => e.preventDefault()}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                  {active && (
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M4 10.5 8 14.5 16 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export const TURNO_OPTIONS = [
  { value: "Matutino", label: "Matutino" },
  { value: "Vespertino", label: "Vespertino" },
];
