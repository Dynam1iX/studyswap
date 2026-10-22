'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Loader2, LogOut, Pencil } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileShell } from '@/components/layout/MobileShell';
import { MyCardItem } from '@/components/profile/MyCardItem';
import { ProfileHeaderCard } from '@/components/profile/ProfileHeaderCard';
import { SettingsPanel } from '@/components/profile/SettingsPanel';
import { StatsRow } from '@/components/profile/StatsRow';
import { SubjectChipList } from '@/components/profile/SubjectChipList';
import { fetchProfile, type Language, type ProfileData } from '@/lib/profile';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'not-found' }
  | { status: 'ready'; data: ProfileData };

/** Fades a block in, each one a little after the previous. */
function Rise({ index, children }: { index: number; children: ReactNode }) {
  return (
    <div style={{ animationDelay: `${index * 70}ms` }} className="animate-rise motion-reduce:animate-none">
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="font-bricolage text-lg font-extrabold text-ink">{children}</h2>;
}

export default function ProfilePage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((data) => {
        if (!cancelled) setState(data ? { status: 'ready', data } : { status: 'not-found' });
      })
      .catch((err: unknown) => {
        console.error('Error loading profile from Supabase:', err);
        if (!cancelled) {
          setState({ status: 'error', message: err instanceof Error ? err.message : 'Could not load the profile' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Editing, card management and sign-out arrive with auth; the buttons are wired but do nothing yet.
  const notReadyYet = () => {};

  return (
    <MobileShell footer={<BottomNav active="profile" />}>
      <AppHeader />

      {/* 16px sides, 8px top and bottom, 16px between blocks. */}
      <div className="flex flex-col gap-4 px-4 py-2">
        <div className="flex items-center justify-between">
          <h1 className="animate-rise font-bricolage text-2xl font-extrabold text-ink motion-reduce:animate-none">Profile</h1>
          <button
            type="button"
            onClick={notReadyYet}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-white px-4 text-sm font-semibold text-ink transition hover:bg-soft"
          >
            <Pencil className="size-4" />
            Edit
          </button>
        </div>

        {state.status === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted">
            <Loader2 className="size-6 animate-spin text-brand-from" />
            <span className="text-xs font-medium">Loading profile...</span>
          </div>
        )}

        {state.status === 'error' && (
          <p className="rounded-2xl border border-[#F2C6D4] bg-white p-6 text-center text-sm font-medium text-[#C0264B]">
            {state.message}
          </p>
        )}

        {state.status === 'not-found' && (
          <p className="rounded-2xl border border-line bg-white p-6 text-center text-sm font-medium text-muted">
            Profile not found
          </p>
        )}

        {state.status === 'ready' && (
          <>
            <Rise index={0}>
              <ProfileHeaderCard user={state.data.user} onEditAvatar={notReadyYet} />
            </Rise>
            <Rise index={1}>
              <StatsRow stats={state.data.stats} />
            </Rise>
            <Rise index={2}>
              <SubjectChipList title="I need help with" subjects={state.data.needsHelp} emptyText="Nothing yet" />
            </Rise>
            <Rise index={3}>
              <SubjectChipList title="I can teach" subjects={state.data.canTeach} emptyText="Nothing yet" />
            </Rise>

            <section style={{ animationDelay: '280ms' }} className="flex animate-rise flex-col gap-4 motion-reduce:animate-none">
              <SectionTitle>My cards</SectionTitle>
              {state.data.cards.length > 0 ? (
                <ul className="flex flex-col gap-4">
                  {state.data.cards.map((card) => (
                    <li key={card.id}>
                      <MyCardItem card={card} onManage={notReadyYet} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-medium text-muted">You have no cards yet. Tap + to create one.</p>
              )}
            </section>

            <section style={{ animationDelay: '350ms' }} className="flex animate-rise flex-col gap-4 motion-reduce:animate-none">
              <SectionTitle>Settings</SectionTitle>
              <SettingsPanel language={language} onLanguageChange={setLanguage} onOpenNotifications={notReadyYet} />
            </section>

            <button
              type="button"
              onClick={notReadyYet}
              style={{ animationDelay: '420ms' }}
              className="flex h-14 animate-rise cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#F2C6D4] bg-white text-base font-extrabold text-[#C0264B] transition hover:bg-[#FFF5F8] active:scale-[0.98] motion-reduce:animate-none"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </>
        )}
      </div>

    </MobileShell>
  );
}
