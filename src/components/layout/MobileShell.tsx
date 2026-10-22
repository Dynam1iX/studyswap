import type { ReactNode } from 'react';

/** id of the element that scrolls the page content (the document itself never scrolls). */
export const APP_SCROLL_ID = 'app-scroll';

interface MobileShellProps {
  children: ReactNode;
  /** Bar pinned under the content: BottomNav, or the Create page's Publish bar. */
  footer?: ReactNode;
}

/**
 * Mobile-first app frame, 576px wide and centred.
 *
 * The frame is exactly one screen tall and only the content area inside it scrolls.
 * The document never scrolls, so iOS Safari / Chrome never collapse their toolbars,
 * which used to shift fixed bars and the bottom sheets away from the screen edge.
 */
export function MobileShell({ children, footer }: MobileShellProps) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[576px] flex-col overflow-hidden bg-page font-montserrat">
      <div id={APP_SCROLL_ID} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-6">
        {children}
      </div>
      {footer && <div className="relative z-40 shrink-0">{footer}</div>}
    </div>
  );
}

/** Scrolls the page content (not the window) back to the top. */
export function scrollAppToTop() {
  document.getElementById(APP_SCROLL_ID)?.scrollTo({ top: 0, behavior: 'smooth' });
}
