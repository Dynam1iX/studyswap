import type { ReactNode } from 'react';

/** id of the content area that scrolls in "app-scroll" mode (see below). */
export const APP_SCROLL_ID = 'app-scroll';

interface MobileShellProps {
  children: ReactNode;
  /** Bar kept at the bottom of the screen: BottomNav, or the Create page's Publish bar. */
  footer?: ReactNode;
  /**
   * Desktop layout (≥992px): the column widens to the Bootstrap container
   * (912px on LG, 1140px on XL, plus the 16px page padding). Without it the page
   * keeps the 576px phone column on desktop too.
   */
  wide?: boolean;
  /**
   * Desktop layout for a single task: the page becomes a card in the middle of the
   * screen that pops in like a modal. "wide" (1000px) for Create, "narrow" (560px) for
   * Complete profile. Phones are unaffected.
   */
  panel?: 'wide' | 'narrow';
  /** Desktop: the full window (Login draws its own two-panel layout). */
  full?: boolean;
}

/**
 * Mobile-first page column, 576px wide and centred. Two layouts, picked per browser
 * before the first paint (script in app/layout.tsx, styles in globals.css):
 *
 * - Default (Safari, desktop): the page scrolls, so Safari can hide its toolbars;
 *   the footer is position: sticky at the bottom.
 * - html.app-scroll (Chrome on iPhone): the column is one screen tall and only
 *   #app-scroll scrolls. Chrome left a strip of page visible under a sticky bar
 *   whenever its toolbars were hidden; with nothing to scroll they never hide.
 *
 * On desktop the phone BottomNav is hidden and the floating DesktopHotbar (root layout)
 * takes its place, so the content leaves room for it at the bottom.
 */
export function MobileShell({ children, footer, wide = false, panel, full = false }: MobileShellProps) {
  const desktop = panel
    ? `lg:relative lg:min-h-0 lg:animate-pop lg:rounded-[28px] lg:border lg:border-line lg:bg-surface lg:p-3 lg:shadow-[0_24px_64px_rgba(27,21,48,0.16)] motion-reduce:lg:animate-none ${
        panel === 'wide' ? 'lg:max-w-[1000px]' : 'lg:max-w-[560px] lg:p-5'
      }`
    : full
      ? 'lg:max-w-none lg:bg-transparent'
      : `lg:bg-transparent ${wide ? 'lg:max-w-[944px] xl:max-w-[1172px]' : ''}`;
  const bottom = panel ? 'lg:pb-1' : full ? 'lg:pb-0' : 'lg:pb-32';
  const shell = (
    <div className={`app-shell mx-auto flex min-h-dvh w-full max-w-[576px] flex-col bg-page font-montserrat ${desktop}`}>
      <div id={APP_SCROLL_ID} className={`app-shell-content relative flex-1 pb-6 ${bottom}`}>
        {children}
      </div>
      {/* Desktop: the footer's own bar is hidden, so it only carries toasts; lift them above the hotbar. */}
      {footer && <div className="sticky bottom-0 z-40 shrink-0 lg:bottom-[104px]">{footer}</div>}
    </div>
  );
  return (
    <>
      {/* Outside the shell: the panel's pop animation would otherwise pin it to the panel. */}
      <DesktopGlow />
      {/* A panel sits in the middle of the window (and scrolls with the page when taller). */}
      {panel ? <div className="lg:flex lg:min-h-dvh lg:items-center lg:justify-center lg:px-6 lg:py-12">{shell}</div> : shell}
    </>
  );
}

/** Soft brand-coloured light in the top corners of the desktop page (under the content, which is positioned). */
function DesktopGlow() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 hidden overflow-hidden lg:block">
      <div className="absolute -top-64 -left-56 size-[560px] rounded-full bg-brand-from/10 blur-[140px]" />
      <div className="absolute -top-72 -right-40 size-[560px] rounded-full bg-brand-to/10 blur-[140px]" />
    </div>
  );
}

/** Scrolls the page (or the content area in app-scroll mode) back to the top. */
export function scrollAppToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById(APP_SCROLL_ID)?.scrollTo({ top: 0, behavior: 'smooth' });
}
