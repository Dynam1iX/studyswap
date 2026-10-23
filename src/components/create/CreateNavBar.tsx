'use client';

import Link from 'next/link';
import { useT } from '@/i18n';

/** "‹ Back · Create Barter Offer · Cancel" row under the logo. */
export function CreateNavBar() {
  const t = useT();
  return (
    <div className="relative z-20 flex items-center justify-between px-4 py-2">
      <Link
        href="/"
        className="-ml-2 flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-[15px] font-semibold text-ink no-underline transition select-none hover:opacity-70 active:scale-95"
      >
        <span className="text-[22px] leading-none font-bold">‹</span>
        <span>{t.common.back}</span>
      </Link>

      <h1 className="font-bricolage text-[18px] font-extrabold tracking-[-0.18px] text-ink">{t.create.title}</h1>

      <Link
        href="/"
        className="-mr-2 cursor-pointer rounded-lg px-2 py-1.5 text-[15px] font-semibold text-muted no-underline transition select-none hover:text-ink active:scale-95"
      >
        {t.common.cancel}
      </Link>
    </div>
  );
}
