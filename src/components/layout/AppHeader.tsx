/** Logo row at the top of every page. */
export function AppHeader() {
  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-2 lg:pt-8 lg:pb-4">
      <div className="flex items-center gap-2.5">
        <img src="/StudySwapLogo.svg" alt="StudySwap" className="size-9 rounded-xl lg:size-10" />
        <span className="font-bricolage text-2xl leading-[29px] font-bold lg:text-[26px] text-ink">StudySwap</span>
      </div>
    </header>
  );
}
