'use client';

import { useRef, useState } from 'react';
import { CODE_LENGTH } from '@/lib/auth';
import { useT } from '@/i18n';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Called once all digits are entered. */
  onComplete: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
}

/**
 * Six boxes over one real input, so paste and the iPhone "From Mail" code
 * suggestion (autocomplete="one-time-code") both work.
 */
export function CodeInput({ value, onChange, onComplete, disabled, error }: CodeInputProps) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative" onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH);
          onChange(digits);
          if (digits.length === CODE_LENGTH) onComplete(digits);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        autoFocus
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label={t.login.codeLabel}
        maxLength={CODE_LENGTH}
        // Invisible but focusable; 16px so iOS does not zoom.
        className="absolute inset-0 z-10 w-full cursor-text text-[16px] opacity-0"
      />
      <div className={`grid grid-cols-6 gap-2 ${error ? 'animate-shake motion-reduce:animate-none' : ''}`}>
        {Array.from({ length: CODE_LENGTH }, (_, index) => {
          const digit = value[index] ?? '';
          const active = focused && index === Math.min(value.length, CODE_LENGTH - 1);
          return (
            <span
              key={index}
              className={`flex h-14 items-center justify-center rounded-xl border bg-surface font-bricolage text-2xl font-extrabold text-ink transition-[border-color,box-shadow,transform] duration-200 ${
                error
                  ? 'border-danger'
                  : active
                    ? 'border-brand-from shadow-[0_0_0_3px_rgba(173,70,255,0.15)]'
                    : digit
                      ? 'border-field'
                      : 'border-line-strong'
              } ${digit ? 'scale-100' : 'scale-[0.97]'}`}
            >
              {digit && (
                <span key={digit + index} className="animate-pop motion-reduce:animate-none">
                  {digit}
                </span>
              )}
              {!digit && active && <span className="h-6 w-0.5 animate-pulse rounded-full bg-brand-from" />}
            </span>
          );
        })}
      </div>
    </div>
  );
}
