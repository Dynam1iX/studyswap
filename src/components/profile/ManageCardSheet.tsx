'use client';

import { useId, useState } from 'react';
import { Loader2, Trash2, X } from 'lucide-react';
import { TOPICS_MAX_LENGTH } from '@/components/create/TopicsField';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { paletteFor } from '@/lib/categoryPalette';
import type { ProfileCard } from '@/lib/profile';
import { useT } from '@/i18n';

export interface CardChanges {
  neededTopic: string;
  offeredTopic: string;
  active: boolean;
}

interface ManageCardSheetProps {
  /** The card to manage, or null when the sheet is closed. */
  card: ProfileCard | null;
  onClose: () => void;
  onSave: (card: ProfileCard, changes: CardChanges) => Promise<void>;
  onDelete: (card: ProfileCard) => Promise<void>;
}

/** Manage one of my cards: edit both topic texts, active ⇄ inactive, delete. Subjects stay fixed. */
export function ManageCardSheet({ card, onClose, onSave, onDelete }: ManageCardSheetProps) {
  const t = useT();
  const titleId = useId();
  // Keep the last card on screen while the sheet animates out.
  const [lastCard, setLastCard] = useState(card);
  /** Counts openings, so every opening gets a fresh form (even for the same card). */
  const [session, setSession] = useState(0);
  if (card && card !== lastCard) {
    setLastCard(card);
    setSession((n) => n + 1);
  }
  const data = card ?? lastCard;

  return (
    <BottomSheet
      open={card !== null}
      onClose={onClose}
      labelledBy={titleId}
      header={
        <div className="flex items-center justify-between px-6 py-2">
          <h2 id={titleId} className="font-bricolage text-[22px] font-extrabold text-ink">
            {t.manage.title}
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
      {/* key: a fresh form every time the sheet opens */}
      {data && <ManageForm key={`${data.id}-${session}`} card={data} onSave={onSave} onDelete={onDelete} />}
    </BottomSheet>
  );
}

function SubjectLine({ label, card, side }: { label: string; card: ProfileCard; side: 'needed' | 'offered' }) {
  const subject = card[side];
  const palette = paletteFor(subject.category);
  return (
    <div style={{ backgroundColor: palette.bg }} className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-2xl px-3.5 py-3">
      <span style={{ color: palette.label }} className="text-[10px] font-semibold tracking-[0.8px] uppercase">
        {label}
      </span>
      <span style={{ color: palette.title }} className="truncate text-[15px] font-bold" title={subject.name}>
        {subject.name}
      </span>
    </div>
  );
}

function TopicInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const near = value.length >= TOPICS_MAX_LENGTH - 20;
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[14px] font-bold text-ink">{label}</span>
      <span className="relative">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value.slice(0, TOPICS_MAX_LENGTH))}
          rows={2}
          className="w-full resize-none rounded-[14px] border border-field p-3 pb-7 text-[16px] leading-relaxed font-semibold text-ink outline-none transition focus:border-brand-from sm:text-[14px]"
        />
        <span
          className={`absolute right-3 bottom-2 text-[12px] font-semibold select-none ${near ? 'text-amber-600' : 'text-muted'}`}
        >
          {value.length} / {TOPICS_MAX_LENGTH}
        </span>
      </span>
    </label>
  );
}

function ManageForm({
  card,
  onSave,
  onDelete,
}: {
  card: ProfileCard;
  onSave: ManageCardSheetProps['onSave'];
  onDelete: ManageCardSheetProps['onDelete'];
}) {
  const t = useT();
  const [neededTopic, setNeededTopic] = useState(card.neededTopic);
  const [offeredTopic, setOfferedTopic] = useState(card.offeredTopic);
  const [active, setActive] = useState(card.status === 'active');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const changed =
    neededTopic.trim() !== card.neededTopic || offeredTopic.trim() !== card.offeredTopic || active !== (card.status === 'active');
  const valid = neededTopic.trim().length > 0 && offeredTopic.trim().length > 0;

  const run = async (kind: 'save' | 'delete') => {
    setBusy(kind);
    setError(null);
    try {
      if (kind === 'save') await onSave(card, { neededTopic: neededTopic.trim(), offeredTopic: offeredTopic.trim(), active });
      else await onDelete(card);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.common.somethingWrong);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 px-6 pt-2 pb-10">
      <div className="flex gap-2">
        <SubjectLine label={t.profile.needs} card={card} side="needed" />
        <SubjectLine label={t.profile.teaches} card={card} side="offered" />
      </div>
      <p className="-mt-2 text-xs font-medium text-muted">{t.manage.subjectsFixed}</p>

      <TopicInput label={t.create.neededTopics} value={neededTopic} onChange={setNeededTopic} />
      <TopicInput label={t.manage.offeredTopics} value={offeredTopic} onChange={setOfferedTopic} />

      {/* Active ⇄ inactive */}
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-soft px-4 py-3">
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-ink">{active ? t.profile.status.active : t.profile.status.archived}</span>
          <span className="text-xs font-medium text-muted">
            {active ? t.manage.activeHint : t.manage.inactiveHint}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={active}
          aria-label={t.manage.activeSwitch}
          onClick={() => setActive((value) => !value)}
          className={`relative h-8 w-14 shrink-0 cursor-pointer rounded-full transition-colors duration-300 ${
            active ? 'bg-linear-to-r from-brand-from to-brand-to' : 'bg-line-strong'
          }`}
        >
          <span
            className={`absolute top-1 left-1 size-6 rounded-full bg-surface shadow-[0_2px_6px_rgba(27,21,48,0.2)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              active ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {error && (
        <p className="animate-shake rounded-xl border border-danger-line bg-danger-soft p-3 text-xs font-semibold text-danger-ink">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => run('save')}
        disabled={!changed || !valid || busy !== null}
        className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-brand-from to-brand-to text-base font-bold text-white shadow-[0_8px_20px_rgba(200,40,140,0.28)] transition active:scale-[0.98] disabled:cursor-default disabled:opacity-50"
      >
        {busy === 'save' && <Loader2 className="size-5 animate-spin" />}
        {t.manage.save}
      </button>

      {/* Delete, with a second step */}
      <div>
        {confirmDelete ? (
          <div className="flex animate-pop flex-col gap-3 rounded-2xl border border-danger-line bg-danger-soft p-4 motion-reduce:animate-none">
            <p className="text-sm font-bold text-danger-ink">{t.manage.deleteConfirm}</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={busy !== null}
                className="h-12 cursor-pointer rounded-xl border border-line-strong bg-surface text-sm font-bold text-ink transition active:scale-[0.98]"
              >
                {t.manage.keep}
              </button>
              <button
                type="button"
                onClick={() => run('delete')}
                disabled={busy !== null}
                className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#C0264B] text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                {busy === 'delete' ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                {t.manage.delete}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-danger-line bg-surface text-sm font-bold text-danger-ink transition hover:bg-danger-soft active:scale-[0.98]"
          >
            <Trash2 className="size-4" />
            {t.manage.deleteCard}
          </button>
        )}
      </div>
    </div>
  );
}
