const SHIMMER =
  'animate-shimmer bg-[linear-gradient(90deg,var(--color-soft),var(--color-line-strong),var(--color-soft))] bg-[length:200%_100%] motion-reduce:animate-none';

function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      style={{ animationDelay: `${index * 90}ms` }}
      className="w-full animate-rise space-y-2.5 rounded-2xl border border-line bg-surface p-4 shadow-sm motion-reduce:animate-none"
    >
      <div className="flex items-center gap-2.5">
        <span className={`size-10 rounded-full ${SHIMMER}`} />
        <div className="flex flex-col gap-1.5">
          <span className={`h-3.5 w-32 rounded-full ${SHIMMER}`} />
          <span className={`h-3 w-44 rounded-full ${SHIMMER}`} />
        </div>
      </div>
      <div className={`h-[83px] rounded-xl ${SHIMMER}`} />
      <div className={`h-[83px] rounded-xl ${SHIMMER}`} />
      <div className={`h-12 rounded-xl ${SHIMMER}`} />
    </div>
  );
}

/** Placeholder cards with a shimmer while the Feed loads. */
export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div aria-busy aria-label="Loading barter offers" className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} index={index} />
      ))}
    </div>
  );
}
