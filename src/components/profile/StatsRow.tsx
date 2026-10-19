import { Star } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ProfileStats } from '@/lib/profile';

interface StatTileProps {
  value: ReactNode;
  label: string;
}

export function StatTile({ value, label }: StatTileProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-white px-2 py-3.5 text-center">
      <span className="flex items-center gap-1 font-bricolage text-3xl leading-7 font-extrabold text-ink">
        {value}
      </span>
      <span className="text-xs font-semibold text-muted">{label}</span>
    </div>
  );
}

export function StatsRow({ stats }: { stats: ProfileStats }) {
  const { rating } = stats;

  return (
    <div className="grid grid-cols-3 gap-2.5">
      <StatTile value={stats.swapsDone} label="Swaps done" />
      <StatTile
        value={
          rating ? (
            <>
              {rating.average.toFixed(1)}
              <Star aria-hidden className="size-5 fill-amber-500 text-amber-500" />
            </>
          ) : (
            '—'
          )
        }
        label={rating ? `${rating.count} ratings` : 'No ratings yet'}
      />
      <StatTile value={stats.activeCards} label="Active cards" />
    </div>
  );
}
