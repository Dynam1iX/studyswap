import type { ReactNode } from 'react';

interface MobileShellProps {
  children: ReactNode;
  /** Bottom space so fixed bars do not cover the content. */
  bottomPadding?: 'nav' | 'action-bar';
  /** Let the content grow past the mobile column on large screens (Profile). */
  wide?: boolean;
}

/** Mobile-first page column, 576px wide and centred like the original pages. */
export function MobileShell({ children, bottomPadding = 'nav', wide = false }: MobileShellProps) {
  return (
    <div
      className={`relative mx-auto min-h-screen w-full bg-page font-montserrat ${wide ? 'max-w-[576px] lg:max-w-5xl' : 'max-w-[576px]'} ${
        bottomPadding === 'nav' ? 'pb-24' : 'pb-[110px]'
      }`}
    >
      {children}
    </div>
  );
}
