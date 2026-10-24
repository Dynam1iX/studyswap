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
export function MobileShell({ children, footer, wide = false }: MobileShellProps) {
  return (
    <div
      className={`app-shell mx-auto flex min-h-dvh w-full max-w-[576px] flex-col bg-page font-montserrat lg:bg-transparent ${
        wide ? 'lg:max-w-[944px] xl:max-w-[1172px]' : ''
      }`}
    >
      <DesktopGlow />
      <div id={APP_SCROLL_ID} className="app-shell-content relative flex-1 pb-6 lg:pb-32">
        {children}
      </div>
      {/* Desktop: the footer's own bar is hidden, so it only carries toasts; lift them above the hotbar. */}
      {footer && <div className="sticky bottom-0 z-40 shrink-0 lg:bottom-[104px]">{footer}</div>}
    </div>
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
