/** Logo row at the top of every page. */
export function AppHeader() {
  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-2">
      <div className="flex items-center gap-2.5">
        <img src="/StudySwapLogo.svg" alt="StudySwap" className="size-9 rounded-xl" />
        <span className="font-bricolage text-2xl leading-[29px] font-bold text-ink">StudySwap</span>
      </div>
    </header>
  );
}
