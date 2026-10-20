import { paletteFor } from '@/lib/categoryPalette';
import type { ProfileCard, ProfileSubject } from '@/lib/profile';
import type { PostStatus } from '@/types/database';

const STATUS_VIEW: Record<PostStatus, { label: string; dot: string; text: string }> = {
  active: { label: 'Active', dot: '#0E9F6E', text: '#0B6B48' },
  completed: { label: 'Completed', dot: '#6D1FC4', text: '#5B24B1' },
  archived: { label: 'Archived', dot: '#9A93B0', text: '#5A5472' },
};

interface HalfProps {
  label: string;
  subject: ProfileSubject;
  /** Extra inner padding on the side the swap badge overlaps. */
  side: 'left' | 'right';
}

function CardHalf({ label, subject, side }: HalfProps) {
  const palette = paletteFor(subject.category);

  return (
    <div
      style={{ backgroundColor: palette.bg }}
      className={`flex min-w-0 flex-1 flex-col justify-center gap-0.5 rounded-2xl py-2 ${side === 'left' ? 'pr-6 pl-4' : 'pr-4 pl-6'}`}
    >
      <span style={{ color: palette.label }} className="text-[10px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      <span style={{ color: palette.title }} className="text-base leading-tight font-bold break-words" title={subject.name}>
        {subject.code}
      </span>
    </div>
  );
}

interface MyCardItemProps {
  card: ProfileCard;
  onManage?: (cardId: string) => void;
}

export function MyCardItem({ card, onManage }: MyCardItemProps) {
  const status = STATUS_VIEW[card.status];

  return (
    <div className="flex flex-col gap-2.5 rounded-3xl border border-line bg-white p-4">
      {/* Negative margins let the badge overlap both halves without absolute positioning. */}
      <div className="flex items-stretch">
        <CardHalf label="Needs" subject={card.needed} side="left" />
        <img
          src="/exchangeminiicon.svg"
          alt=""
          className="z-10 -mx-4 size-9 shrink-0 self-center rounded-full border-[3px] border-white"
        />
        <CardHalf label="Teaches" subject={card.offered} side="right" />
      </div>

      <div className="flex items-center justify-between">
        <span style={{ color: status.text }} className="flex items-center gap-1.5 text-xs font-semibold">
          <span aria-hidden style={{ backgroundColor: status.dot }} className="size-2 rounded-sm" />
          {status.label}
        </span>
        <button
          type="button"
          onClick={() => onManage?.(card.id)}
          className="h-10 cursor-pointer rounded-xl border border-line-strong bg-white px-3.5 text-xs font-semibold text-ink transition hover:bg-page"
        >
          Manage
        </button>
      </div>
    </div>
  );
}
