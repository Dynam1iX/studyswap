import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileShell } from '@/components/layout/MobileShell';

/** Placeholder until the Feed page lands. */
export default function HomePage() {
  return (
    <MobileShell>
      <AppHeader />
      <main className="px-4 py-2">
        <p className="rounded-2xl border border-line bg-white p-6 text-center text-xs font-medium text-muted">
          The feed is on its way.
        </p>
      </main>
      <BottomNav active="feed" />
    </MobileShell>
  );
}
