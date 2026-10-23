'use client';

import { useId, useState } from 'react';
import { Download, Loader2, Trash2, X } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useT } from '@/i18n';

interface PrivacySheetProps {
  open: boolean;
  onClose: () => void;
  onDownload: () => Promise<void>;
  /** Deletes the account; the page signs out and leaves afterwards. */
  onDeleteAccount: () => Promise<void>;
}

/** The word typed to confirm account deletion. */
const DELETE_WORD = 'DELETE';

function SectionTitle({ children }: { children: string }) {
  return <h3 className="font-bricolage text-lg font-extrabold text-ink">{children}</h3>;
}

/** Privacy and security: download my data, delete account. */
export function PrivacySheet({
  open,
  onClose,
  onDownload,
  onDeleteAccount,
}: PrivacySheetProps) {
  const t = useT();
  const titleId = useId();
  const [downloading, setDownloading] = useState(false);
  const [deleteWord, setDeleteWord] = useState('');
  const [deleting, setDeleting] = useState(false);
  const canDelete = deleteWord.trim().toUpperCase() === DELETE_WORD;
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setDownloading(true);
    setError(null);
    try {
      await onDownload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.privacy.downloadError);
    } finally {
      setDownloading(false);
    }
  };

  const deleteAccount = async () => {
    if (!canDelete || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await onDeleteAccount();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.privacy.deleteError);
      setDeleting(false);
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
            {t.settings.privacy}
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
      <div className="flex flex-col gap-6 px-6 pt-2 pb-10">
        {/* Download my data */}
        <section className="flex flex-col gap-3">
          <SectionTitle>{t.privacy.yourData}</SectionTitle>
          <p className="text-sm font-medium text-muted">
            {t.privacy.yourDataHint}
          </p>
          <button
            type="button"
            onClick={download}
            disabled={downloading}
            className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-line-strong bg-surface text-sm font-bold text-ink transition hover:bg-soft active:scale-[0.98] disabled:opacity-60"
          >
            {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {t.privacy.download}
          </button>
        </section>

        {/* Delete account: the button unlocks once DELETE is typed */}
        <section className="flex flex-col gap-3">
          <SectionTitle>{t.privacy.deleteTitle}</SectionTitle>
          <p className="text-sm font-medium text-muted">
            {t.privacy.deleteHintBefore}
            <span className="font-bold text-ink">{DELETE_WORD}</span>
            {t.privacy.deleteHintAfter}
          </p>
          <input
            type="text"
            value={deleteWord}
            onChange={(event) => setDeleteWord(event.target.value)}
            placeholder={DELETE_WORD}
            autoCapitalize="characters"
            autoComplete="off"
            aria-label={t.privacy.typeToConfirm(DELETE_WORD)}
            className="h-12 rounded-[14px] border border-field px-4 text-[16px] font-semibold text-ink outline-none transition placeholder:text-placeholder focus:border-danger-ink sm:text-[14px]"
          />
          <button
            type="button"
            onClick={deleteAccount}
            disabled={!canDelete || deleting}
            className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#C0264B] text-sm font-bold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {t.privacy.deleteButton}
          </button>
        </section>

        {error && (
          <p className="animate-shake rounded-xl border border-danger-line bg-danger-soft p-3 text-xs font-semibold text-danger-ink">
            {error}
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
