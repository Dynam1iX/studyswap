'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { FAVORITE_ADDED_EVENT } from '@/lib/favorites';
import { useT } from '@/i18n';

export type NavTab = 'feed' | 'search' | 'favorite' | 'profile';

interface TabConfig {
  tab: NavTab;
  href: string;
  icon: string;
  activeIcon: string;
  /** Pages that do not exist yet are shown dimmed and cannot be tapped. */
  ready: boolean;
}

const LEFT_TABS: TabConfig[] = [
  { tab: 'feed', href: '/', icon: '/home.svg', activeIcon: '/feedselected.svg', ready: true },
  { tab: 'search', href: '/search', icon: '/search.svg', activeIcon: '/searchselected.svg', ready: true },
];

const RIGHT_TABS: TabConfig[] = [
  { tab: 'favorite', href: '/favorites', icon: '/like.svg', activeIcon: '/likeselected.svg', ready: true },
  { tab: 'profile', href: '/profile', icon: '/profile.svg', activeIcon: '/profileselected.svg', ready: true },
];

/** Counts likes made on this page, so the Favorite icon can bounce once per like. */
export function useFavoritePings(): number {
  const [pings, setPings] = useState(0);
  useEffect(() => {
    const onAdded = () => setPings((n) => n + 1);
    window.addEventListener(FAVORITE_ADDED_EVENT, onAdded);
    return () => window.removeEventListener(FAVORITE_ADDED_EVENT, onAdded);
  }, []);
  return pings;
}

function NavTabItem({ config, active, pings = 0 }: { config: TabConfig; active: boolean; pings?: number }) {
  const t = useT();
  const label = t.nav[config.tab];
  const bounce = active || pings > 0;
  const content = (
    <>
      <img
        // A new key replays the bounce on every like.
        key={pings}
        src={active ? config.activeIcon : config.icon}
        // Decorative: the tab's name is written under it.
        alt=""
        className={`size-[22px] ${active ? '' : 'theme-icon'} ${bounce ? 'animate-nav-bounce motion-reduce:animate-none' : ''}`}
      />
      <span
        className={`text-[11px] font-semibold ${
          active ? 'bg-linear-to-r from-brand-text-from to-brand-text-to bg-clip-text text-transparent' : 'text-muted'
        }`}
      >
        {label}
      </span>
    </>
  );

  if (active) {
    return (
      <div aria-current="page" className="flex w-12 cursor-default flex-col items-center gap-1 text-center select-none">
        {content}
      </div>
    );
  }

  if (!config.ready) {
    return (
      <div aria-disabled className="pointer-events-none flex w-12 cursor-not-allowed flex-col items-center gap-1 text-center opacity-60 select-none">
        {content}
      </div>
    );
  }

  return (
    <Link href={config.href} className="flex w-12 flex-col items-center gap-1 text-center transition-transform select-none active:scale-90">
      {content}
    </Link>
  );
}

/** Bottom bar shared by every page (rendered as MobileShell's footer). Phones only: desktop uses DesktopHotbar. */
export function BottomNav({ active }: { active: NavTab }) {
  const t = useT();
  const favoritePings = useFavoritePings();
  return (
    <nav className="flex h-[76px] w-full lg:hidden items-center justify-around border-t border-line bg-surface px-3">
      {LEFT_TABS.map((config) => (
        <NavTabItem key={config.tab} config={config} active={config.tab === active} />
      ))}

      <div className="relative flex h-[50px] w-[58px] justify-center">
        <Link
          href="/create"
          aria-label={t.nav.create}
          className="halo group absolute -top-5 flex size-[58px] cursor-pointer items-center justify-center rounded-full border-4 border-surface bg-linear-135 from-[#A23BF5] to-[#E5237F] text-white shadow-[0_8px_20px_rgba(200,40,140,0.35)] transition hover:scale-105 active:scale-95"
        >
          <Plus
            className="size-7 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-90 group-active:rotate-90"
            strokeWidth={2.5}
          />
        </Link>
      </div>

      {RIGHT_TABS.map((config) => (
        <NavTabItem
          key={config.tab}
          config={config}
          active={config.tab === active}
          pings={config.tab === 'favorite' ? favoritePings : 0}
        />
      ))}
    </nav>
  );
}
