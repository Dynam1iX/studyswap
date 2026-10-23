'use client';

import type { FormEvent, RefObject } from 'react';
import { Search, X } from 'lucide-react';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Enter: run the search with the trimmed text. */
  onSubmit: (query: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

/** Search box: a gradient ring and a brand-coloured icon fade in on focus. */
export function SearchField({ value, onChange, onSubmit, inputRef }: SearchFieldProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(value.trim());
    inputRef?.current?.blur();
  };

  return (
    <form role="search" onSubmit={handleSubmit} className="group relative">
      {/* Gradient ring, shown while the field has focus */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[2px] rounded-[18px] bg-linear-to-r from-brand-from to-brand-to opacity-0 blur-[0.5px] transition-opacity duration-300 group-focus-within:opacity-100"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-1.5 rounded-[22px] bg-linear-to-r from-brand-from/25 to-brand-to/25 opacity-0 blur-md transition-opacity duration-500 group-focus-within:opacity-100"
      />

      <label className="relative flex h-14 cursor-text items-center gap-3 rounded-2xl border border-field bg-surface px-4 shadow-[0_6px_18px_rgba(60,30,110,0.06)] transition-colors duration-300 group-focus-within:border-transparent">
        <Search
          aria-hidden
          className="size-5 shrink-0 text-muted transition-[color,transform] duration-300 group-focus-within:scale-110 group-focus-within:text-brand-from"
          strokeWidth={2.2}
        />
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          maxLength={100}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search subjects, e.g. Calculus"
          aria-label="Search subjects"
          className="min-w-0 flex-1 bg-transparent text-base font-semibold text-ink outline-none placeholder:text-placeholder"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              inputRef?.current?.focus();
            }}
            aria-label="Clear the search text"
            className="flex size-8 shrink-0 animate-pop cursor-pointer items-center justify-center rounded-full bg-soft text-muted transition hover:bg-line hover:text-ink active:scale-90 motion-reduce:animate-none"
          >
            <X className="size-4" strokeWidth={2.4} />
          </button>
        )}
      </label>
    </form>
  );
}
