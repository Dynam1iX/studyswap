import type { ReactNode } from 'react';
import { HelpButton } from '@/components/help/HelpSheet';

/**
 * Logo row at the top of every page; `actions` sit on the right (default: the "How it works" button).
 * Custom actions (Login: language, theme, sound) move under the logo on screens narrower than 400px.
 */
export function AppHeader({ actions }: { actions?: ReactNode }) {
  return (
    <header
      className={`flex items-center justify-between gap-3 px-4 pt-4 pb-2 lg:pt-8 lg:pb-4 ${
        actions ? 'max-[400px]:flex-col max-[400px]:items-start' : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {/* Decorative: the name is written right next to it. */}
        <img src="/StudySwapLogo.svg" alt="" className="size-9 shrink-0 rounded-xl lg:size-10" />
        <span className="font-bricolage text-2xl leading-[29px] font-bold text-ink lg:text-[26px]">StudySwap</span>
      </div>
      {actions ?? <HelpButton />}
    </header>
  );
}
