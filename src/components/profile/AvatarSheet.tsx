'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { Camera, Check, Loader2, Trash2, X } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { prepareAvatar, type PreparedAvatar } from '@/lib/avatar';
import { useT } from '@/i18n';

interface AvatarSheetProps {
  open: boolean;
  onClose: () => void;
  initials: string;
  /** Current photo URL, or null. */
  currentUrl: string | null;
  onSave: (avatar: PreparedAvatar) => Promise<void>;
  onRemove: () => Promise<void>;
}

/**
 * Profile photo: choose from the gallery or take a photo (the phone offers both
 * for an image file input), preview it cropped to a circle, then save; or remove it.
 */
export function AvatarSheet({ open, onClose, initials, currentUrl, onSave, onRemove }: AvatarSheetProps) {
  const t = useT();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<PreparedAvatar | null>(null);
  const [busy, setBusy] = useState<'prepare' | 'save' | 'remove' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start clean every time the sheet opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setPicked(null);
      setError(null);
      setBusy(null);
    }
  }

  // Free the preview image when it is replaced or the sheet unmounts.
  useEffect(() => {
    const url = picked?.previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [picked]);

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // picking the same file again still fires change
    if (!file) return;
    setBusy('prepare');
    setError(null);
    try {
      setPicked(await prepareAvatar(file));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.avatar.openError);
    } finally {
      setBusy(null);
    }
  };

  const run = async (kind: 'save' | 'remove') => {
    setBusy(kind);
    setError(null);
    try {
      if (kind === 'save' && picked) await onSave(picked);
      if (kind === 'remove') await onRemove();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.common.somethingWrong);
    } finally {
      setBusy(null);
    }
  };

  const previewUrl = picked?.previewUrl ?? currentUrl;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      header={
        <div className="flex items-center justify-between px-6 py-2">
          <h2 id={titleId} className="font-bricolage text-[22px] font-extrabold text-ink">
            {t.avatar.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-soft text-ink transition hover:bg-line focus-visible:outline-2 focus-visible:outline-brand-from"
          >
            <X className="size-5" strokeWidth={2.4} />
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-5 px-6 pt-2 pb-10">
        {/* Preview */}
        <div className="relative size-40 rounded-full bg-linear-to-br from-brand-from to-brand-to p-1 shadow-[0_10px_30px_rgba(173,70,255,0.25)]">
          <div className="flex size-full items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-brand-soft">
            {previewUrl ? (
              <img
                key={previewUrl}
                src={previewUrl}
                alt={t.avatar.title}
                draggable={false}
                className="size-full animate-pop rounded-full object-cover pointer-events-none select-none [-webkit-touch-callout:none] motion-reduce:animate-none"
              />
            ) : (
              <span className="font-bricolage text-5xl font-extrabold text-brand-ink">{initials}</span>
            )}
          </div>
          {busy === 'prepare' && (
            <span className="absolute inset-1 flex items-center justify-center rounded-full bg-surface/70">
              <Loader2 className="size-7 animate-spin text-brand-from" />
            </span>
          )}
        </div>
        <p className="text-center text-xs font-medium text-muted">
          {t.avatar.cropHint}
        </p>

        <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

        {picked ? (
          <div className="grid w-full grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy !== null}
              className="h-12 cursor-pointer rounded-2xl border border-line-strong bg-surface text-sm font-bold text-ink transition hover:bg-soft active:scale-[0.98] disabled:opacity-60"
            >
              {t.avatar.chooseAnother}
            </button>
            <button
              type="button"
              onClick={() => run('save')}
              disabled={busy !== null}
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-brand-fill-from to-brand-fill-to text-sm font-bold text-white shadow-[0_6px_16px_rgba(173,70,255,0.3)] transition active:scale-[0.98] disabled:opacity-60"
            >
              {busy === 'save' ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" strokeWidth={3} />}
              {t.avatar.save}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy !== null}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-brand-fill-from to-brand-fill-to text-sm font-bold text-white shadow-[0_6px_16px_rgba(173,70,255,0.3)] transition active:scale-[0.98] disabled:opacity-60"
          >
            <Camera className="size-4" />
            {currentUrl ? t.avatar.chooseNew : t.avatar.choose}
          </button>
        )}

        {currentUrl && !picked && (
          <button
            type="button"
            onClick={() => run('remove')}
            disabled={busy !== null}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-danger-line bg-surface text-sm font-bold text-danger-ink transition hover:bg-danger-soft active:scale-[0.98] disabled:opacity-60"
          >
            {busy === 'remove' ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {t.avatar.remove}
          </button>
        )}

        {error && (
          <p className="w-full animate-shake rounded-xl border border-danger-line bg-danger-soft p-3 text-xs font-semibold text-danger-ink">
            {error}
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
