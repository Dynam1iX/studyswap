'use client';

import type { ComponentType, SVGProps } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useFavoritePings, type NavTab } from '@/components/layout/BottomNav';
import { HeartIcon, HomeIcon, ProfileIcon, SearchIcon } from '@/components/layout/NavIcons';
import { useT } from '@/i18n';

interface HotbarTab {
  tab: NavTab;
  href: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const LEFT: HotbarTab[] = [
  { tab: 'feed', href: '/', Icon: HomeIcon },
  { tab: 'search', href: '/search', Icon: SearchIcon },
];

const RIGHT: HotbarTab[] = [
  { tab: 'favorite', href: '/favorites', Icon: HeartIcon },
  { tab: 'profile', href: '/profile', Icon: ProfileIcon },
];

/** Pages that show the hotbar, and the tab each one lights up. */
const TAB_BY_PATH: Record<string, NavTab> = {
  '/': 'feed',
  '/search': 'search',
  '/favorites': 'favorite',
  '/profile': 'profile',
};

/** Spring used by the mobile animations (nav-bounce, pop). */
const SPRING = 'ease-[cubic-bezier(0.34,1.56,0.64,1)]';

function HotbarItem({ config, active, pings }: { config: HotbarTab; active: boolean; pings: number }) {
  const t = useT();
  const label = t.nav[config.tab];
  const { Icon } = config;

  return (
    <Link
      href={config.href}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex h-11 items-center rounded-full transition-[padding,background-color,color,transform] duration-500 ${SPRING} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-from active:scale-95 ${
        active
          ? 'pr-5 pl-[18px] text-white'
          : 'bg-soft px-[11px] text-muted hover:bg-line-strong hover:text-ink'
      }`}
    >
      {/* Gradient pill: grows in on the active tab, shrinks away on the one being left. */}
      <span
        aria-hidden
        className={`absolute inset-0 rounded-full bg-linear-to-r from-brand-from to-brand-to shadow-[0_6px_16px_rgba(173,70,255,0.35)] transition-[opacity,transform] duration-500 ${SPRING} ${
          active ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      />
      <Icon
        // A new key replays the bounce when the tab turns active and on every like.
        key={`${active}-${pings}`}
        className={`relative size-[22px] shrink-0 ${
          active || pings > 0 ? 'animate-nav-bounce motion-reduce:animate-none' : ''
        }`}
      />
      {/* Label: its column opens from 0 to its width, so the pill stretches smoothly. */}
      <span
        className={`relative grid transition-[grid-template-columns,opacity,margin] duration-500 ${SPRING} ${
          active ? 'ml-2 grid-cols-[1fr] opacity-100' : 'ml-0 grid-cols-[0fr] opacity-0'
        }`}
      >
        <span className="overflow-hidden text-[15px] font-semibold whitespace-nowrap">{label}</span>
      </span>
    </Link>
  );
}

/**
 * Desktop navigation (≥992px): a floating glass bar at the bottom centre. It lives in the
 * root layout, so it stays mounted between pages and the active pill can flow from tab to tab.
 */
export function DesktopHotbar() {
  const t = useT();
  const pathname = usePathname();
  const favoritePings = useFavoritePings();
  const active = TAB_BY_PATH[pathname];
  if (!active) return null;

  const item = (config: HotbarTab) => (
    <HotbarItem
      key={config.tab}
      config={config}
      active={config.tab === active}
      pings={config.tab === 'favorite' ? favoritePings : 0}
    />
  );

  return (
    <nav className="fixed bottom-7 left-1/2 z-40 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-surface/70 p-2 font-montserrat shadow-[0_12px_32px_rgba(60,30,110,0.16)] backdrop-blur-xl lg:flex">
      {LEFT.map(item)}

      <Link
        href="/create"
        aria-label={t.nav.create}
        className="halo group relative mx-0.5 flex size-[52px] cursor-pointer items-center justify-center rounded-full bg-linear-135 from-[#A23BF5] to-[#E5237F] text-white shadow-[0_8px_20px_rgba(200,40,140,0.35)] ring-[3px] ring-surface transition hover:scale-105 active:scale-95"
      >
        <Plus
          className={`size-[26px] transition-transform duration-300 ${SPRING} group-hover:rotate-90`}
          strokeWidth={2.5}
        />
      </Link>

      {RIGHT.map(item)}
    </nav>
  );
}
