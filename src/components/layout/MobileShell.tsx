import type { ReactNode } from 'react';

/** id of the content area that scrolls in "app-scroll" mode (see below). */
export const APP_SCROLL_ID = 'app-scroll';

interface MobileShellProps {
  children: ReactNode;
  /** Bar kept at the bottom of the screen: BottomNav, or the Create page's Publish bar. */
  footer?: ReactNode;
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
 */
export function MobileShell({ children, footer }: MobileShellProps) {
  return (
    <div className="app-shell mx-auto flex min-h-dvh w-full max-w-[576px] flex-col bg-page font-montserrat">
      <div id={APP_SCROLL_ID} className="app-shell-content flex-1 pb-6">
        {children}
      </div>
      {footer && <div className="sticky bottom-0 z-40 shrink-0">{footer}</div>}
    </div>
  );
}

/** Scrolls the page (or the content area in app-scroll mode) back to the top. */
export function scrollAppToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById(APP_SCROLL_ID)?.scrollTo({ top: 0, behavior: 'smooth' });
}
