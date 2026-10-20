import type { ReactNode } from 'react';

interface MobileShellProps {
  children: ReactNode;
  /** Bottom space so fixed bars do not cover the content. */
  bottomPadding?: 'nav' | 'action-bar';
}

/** Mobile-first page column, 576px wide and centred like the original pages. */
export function MobileShell({ children, bottomPadding = 'nav' }: MobileShellProps) {
  return (
    <div
      className={`relative mx-auto min-h-screen w-full bg-page font-montserrat max-w-[576px] ${
        bottomPadding === 'nav' ? 'pb-24' : 'pb-[110px]'
      }`}
    >
      {children}
    </div>
  );
}
