import { Pencil } from 'lucide-react';

interface AvatarProps {
  initials: string;
  onEdit?: () => void;
}

/** Gradient ring avatar. The edit badge shares the same grid cell instead of absolute positioning. */
export function Avatar({ initials, onEdit }: AvatarProps) {
  return (
    <div className="grid size-20 shrink-0 animate-pop motion-reduce:animate-none">
      <div className="col-start-1 row-start-1 rounded-full bg-linear-to-br from-brand-from to-brand-to p-[3px]">
        <div className="flex size-full items-center justify-center rounded-full border-[3px] border-white bg-[#F1E9FF]">
          <span className="font-bricolage text-2xl font-extrabold text-[#6D1FC4]">{initials}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Change photo"
        className="col-start-1 row-start-1 flex size-8 cursor-pointer items-center justify-center self-end justify-self-end rounded-full border-[3px] border-white bg-ink text-white transition-transform hover:scale-110 hover:-rotate-12 active:scale-90"
      >
        <Pencil className="size-3.5" strokeWidth={2.4} />
      </button>
    </div>
  );
}
