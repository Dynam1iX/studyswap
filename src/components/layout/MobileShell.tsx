import type { ReactNode } from 'react';

interface MobileShellProps {
  children: ReactNode;
  /** Bar kept at the bottom of the screen: BottomNav, or the Create page's Publish bar. */
  footer?: ReactNode;
}

/**
 * Mobile-first page column, 576px wide and centred.
 *
 * The page itself scrolls, so Safari / Chrome on iPhone can hide their toolbars.
 * The footer is position: sticky (part of the page), not position: fixed: fixed
 * bars were left with a gap under them when the iOS toolbars collapsed.
 */
export function MobileShell({ children, footer }: MobileShellProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[576px] flex-col bg-page font-montserrat">
      <div className="flex-1 pb-6">{children}</div>
      {footer && <div className="sticky bottom-0 z-40">{footer}</div>}
    </div>
  );
}

/** Scrolls the page back to the top. */
export function scrollAppToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
