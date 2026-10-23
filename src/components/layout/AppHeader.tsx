'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useT } from '@/i18n';
import { useRequests } from '@/lib/requests';

/** The bell: opens Requests; the badge counts new requests and unseen answers. */
function RequestsBell() {
  const t = useT();
  const { items } = useRequests();
  const count = items?.filter((item) => item.unseen).length ?? 0;
  // A new key replays the ring each time the count grows.
  const [lastCount, setLastCount] = useState(count);
  const [rings, setRings] = useState(0);
  if (count !== lastCount) {
    setLastCount(count);
    if (count > lastCount) setRings((n) => n + 1);
  }

  return (
    <Link
      href="/requests"
      aria-label={count > 0 ? t.requests.bellWithCount(count) : t.requests.title}
      className="relative flex size-11 items-center justify-center rounded-full text-ink transition hover:bg-soft active:scale-90"
    >
      <Bell
        key={rings}
        aria-hidden
        className={`size-6 origin-top ${rings > 0 ? 'animate-bell motion-reduce:animate-none' : ''}`}
        strokeWidth={2.1}
      />
      {count > 0 && (
        <span
          key={count}
          className="absolute top-1 right-1 flex h-[18px] min-w-[18px] animate-pop items-center justify-center rounded-full border-2 border-page bg-linear-to-r from-brand-from to-brand-to px-1 text-[10px] leading-none font-extrabold text-white motion-reduce:animate-none"
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}

/** Logo row at the top of every page; signed-in pages also get the requests bell. */
export function AppHeader({ bell = true }: { bell?: boolean }) {
  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-2">
      <div className="flex items-center gap-2.5">
        <img src="/StudySwapLogo.svg" alt="StudySwap" className="size-9 rounded-xl" />
        <span className="font-bricolage text-2xl leading-[29px] font-bold text-ink">StudySwap</span>
      </div>
      {bell && <RequestsBell />}
    </header>
  );
}
