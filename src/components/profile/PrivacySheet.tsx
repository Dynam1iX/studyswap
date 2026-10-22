'use client';

import { useId, useState } from 'react';
import { Check, Download, Loader2, Trash2, X } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { TelegramVisibility } from '@/types/database';

interface PrivacySheetProps {
  open: boolean;
  onClose: () => void;
  telegramVisibility: TelegramVisibility;
  onTelegramVisibilityChange: (visibility: TelegramVisibility) => Promise<void>;
  onDownload: () => Promise<void>;
}

const VISIBILITY_OPTIONS: { value: TelegramVisibility; title: string; hint: string }[] = [
  { value: 'everyone', title: 'All students', hint: 'Your cards show a "Message on Telegram" button.' },
  {
    value: 'accepted',
    title: 'Only after I accept a request',
    hint: 'Until then, students contact you by university e-mail.',
  },
];

/** The word typed to confirm account deletion. */
const DELETE_WORD = 'DELETE';

function SectionTitle({ children }: { children: string }) {
  return <h3 className="font-bricolage text-lg font-extrabold text-ink">{children}</h3>;
}

/** Privacy and security: Telegram visibility, download my data, delete account. */
export function PrivacySheet({ open, onClose, telegramVisibility, onTelegramVisibilityChange, onDownload }: PrivacySheetProps) {
  const titleId = useId();
  const [saving, setSaving] = useState<TelegramVisibility | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [deleteWord, setDeleteWord] = useState('');
  const [error, setError] = useState<string | null>(null);

  const chooseVisibility = async (value: TelegramVisibility) => {
    if (value === telegramVisibility || saving) return;
    setSaving(value);
    setError(null);
    try {
      await onTelegramVisibilityChange(value);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save the setting');
    } finally {
      setSaving(null);
    }
  };

  const download = async () => {
    setDownloading(true);
    setError(null);
    try {
      await onDownload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not prepare your data');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      header={
        <div className="flex items-center justify-between px-6 py-2">
          <h2 id={titleId} className="font-bricolage text-[22px] font-extrabold text-ink">
            Privacy and security
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-soft text-ink transition hover:bg-line focus-visible:outline-2 focus-visible:outline-brand-from"
          >
            <X className="size-5" strokeWidth={2.4} />
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 px-6 pt-2 pb-10">
        {/* Who sees my Telegram */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Who can see my Telegram</SectionTitle>
          <div role="radiogroup" aria-label="Who can see my Telegram" className="flex flex-col gap-2">
            {VISIBILITY_OPTIONS.map((option) => {
              const selected = option.value === telegramVisibility;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => chooseVisibility(option.value)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-[border-color,background-color,transform] duration-200 active:scale-[0.98] ${
                    selected ? 'border-brand-from bg-[#FBF5FF]' : 'border-line-strong bg-white hover:bg-soft/60'
                  }`}
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-bold text-ink">{option.title}</span>
                    <span className="text-xs font-medium text-muted">{option.hint}</span>
                  </span>
                  <span
                    aria-hidden
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                      selected
                        ? 'scale-100 bg-linear-to-r from-brand-from to-brand-to text-white'
                        : 'scale-90 border-2 border-line-strong text-transparent'
                    }`}
                  >
                    {saving === option.value ? (
                      <Loader2 className="size-3.5 animate-spin text-brand-from" />
                    ) : (
                      <Check className="size-3.5" strokeWidth={3} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Download my data */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Your data</SectionTitle>
          <p className="text-sm font-medium text-muted">
            Download everything StudySwap stores about you: profile, cards, swap requests, likes and recent searches.
          </p>
          <button
            type="button"
            onClick={download}
            disabled={downloading}
            className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-line-strong bg-white text-sm font-bold text-ink transition hover:bg-soft active:scale-[0.98] disabled:opacity-60"
          >
            {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Download my data (JSON)
          </button>
        </section>

        {/* Delete account: enabled once sign-in exists */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Delete account</SectionTitle>
          <p className="text-sm font-medium text-muted">
            Deletes your profile, all your cards, likes and searches. This cannot be undone. Type{' '}
            <span className="font-bold text-ink">{DELETE_WORD}</span> to confirm.
          </p>
          <input
            type="text"
            value={deleteWord}
            onChange={(event) => setDeleteWord(event.target.value)}
            placeholder={DELETE_WORD}
            autoCapitalize="characters"
            autoComplete="off"
            aria-label={`Type ${DELETE_WORD} to confirm`}
            className="h-12 rounded-[14px] border border-field px-4 text-[16px] font-semibold text-ink outline-none transition placeholder:text-placeholder focus:border-[#C0264B] sm:text-[14px]"
          />
          <button
            type="button"
            disabled
            title="Available after sign-in"
            className="flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-[#C0264B] text-sm font-bold text-white opacity-40"
          >
            <Trash2 className="size-4" />
            Delete my account
          </button>
          <p className="text-xs font-medium text-muted">Available after sign-in with your university account.</p>
        </section>

        {error && (
          <p className="animate-shake rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
