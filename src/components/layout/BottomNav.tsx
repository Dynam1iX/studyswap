import Link from 'next/link';
import { Plus } from 'lucide-react';

export type NavTab = 'feed' | 'search' | 'favorite' | 'profile';

interface TabConfig {
  tab: NavTab;
  href: string;
  label: string;
  icon: string;
  activeIcon: string;
  /** Pages that do not exist yet are shown dimmed and cannot be tapped. */
  ready: boolean;
}

const LEFT_TABS: TabConfig[] = [
  { tab: 'feed', href: '/', label: 'Feed', icon: '/home.svg', activeIcon: '/feedselected.svg', ready: true },
  { tab: 'search', href: '/search', label: 'Search', icon: '/search.svg', activeIcon: '/searchselected.svg', ready: true },
];

const RIGHT_TABS: TabConfig[] = [
  { tab: 'favorite', href: '/favorites', label: 'Favorite', icon: '/like.svg', activeIcon: '/likeselected.svg', ready: false },
  { tab: 'profile', href: '/profile', label: 'Profile', icon: '/profile.svg', activeIcon: '/profileselected.svg', ready: true },
];

function NavTabItem({ config, active }: { config: TabConfig; active: boolean }) {
  const content = (
    <>
      <img src={active ? config.activeIcon : config.icon} alt={config.label} className="size-[22px]" />
      <span
        className={`text-[11px] font-semibold ${
          active ? 'bg-linear-to-r from-brand-from to-brand-to bg-clip-text text-transparent' : 'text-muted'
        }`}
      >
        {config.label}
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
    <Link href={config.href} className="flex w-12 flex-col items-center gap-1 text-center select-none">
      {content}
    </Link>
  );
}

/** Fixed bottom bar shared by every page. */
export function BottomNav({ active }: { active: NavTab }) {
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex h-[76px] w-full max-w-[576px] -translate-x-1/2 items-center justify-around border-t border-line bg-white px-3">
      {LEFT_TABS.map((config) => (
        <NavTabItem key={config.tab} config={config} active={config.tab === active} />
      ))}

      <div className="relative flex h-[50px] w-[58px] justify-center">
        <Link
          href="/create"
          aria-label="Create barter card"
          className="absolute -top-5 flex size-[58px] cursor-pointer items-center justify-center rounded-full border-4 border-white bg-linear-135 from-[#A23BF5] to-[#E5237F] text-white shadow-[0_8px_20px_rgba(200,40,140,0.35)] transition hover:scale-105 active:scale-95"
        >
          <Plus className="size-7" strokeWidth={2.5} />
        </Link>
      </div>

      {RIGHT_TABS.map((config) => (
        <NavTabItem key={config.tab} config={config} active={config.tab === active} />
      ))}
    </nav>
  );
}
