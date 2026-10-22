'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Loader2, LogOut, Pencil } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileShell } from '@/components/layout/MobileShell';
import { ManageCardSheet, type CardChanges } from '@/components/profile/ManageCardSheet';
import { MyCardItem } from '@/components/profile/MyCardItem';
import { PrivacySheet } from '@/components/profile/PrivacySheet';
import { ProfileHeaderCard } from '@/components/profile/ProfileHeaderCard';
import { SettingsPanel } from '@/components/profile/SettingsPanel';
import { StatsRow } from '@/components/profile/StatsRow';
import { SubjectChipList } from '@/components/profile/SubjectChipList';
import { Toast, useToast } from '@/components/ui/Toast';
import {
  deleteMyCard,
  downloadMyData,
  fetchProfile,
  setMyCardStatus,
  setTelegramVisibility,
  updateMyCard,
  type Language,
  type ProfileCard,
  type ProfileData,
} from '@/lib/profile';
import type { TelegramVisibility } from '@/types/database';

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
  /** The card whose Manage sheet is open, or null. */
  const [managing, setManaging] = useState<ProfileCard | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const { toast, show: showToast, hide: hideToast } = useToast();

  const load = useCallback(() => {
    return fetchProfile()
      .then((data) => setState(data ? { status: 'ready', data } : { status: 'not-found' }))
      .catch((err: unknown) => {
        console.error('Error loading profile from Supabase:', err);
        setState({ status: 'error', message: err instanceof Error ? err.message : 'Could not load the profile' });
      });
  }, []);

  useEffect(() => {
    // Also runs again when the page comes back into view (Next keeps it alive while hidden).
    void load();
  }, [load]);

  // Telegram linking and sign-out arrive with Microsoft sign-in and the Telegram bot.
  const afterSignIn = () => showToast('Available after sign-in');

  const saveCard = async (card: ProfileCard, changes: CardChanges) => {
    if (changes.neededTopic !== card.neededTopic || changes.offeredTopic !== card.offeredTopic) {
      await updateMyCard(card.id, changes.neededTopic, changes.offeredTopic);
    }
    if (changes.active !== (card.status === 'active')) {
      await setMyCardStatus(card.id, changes.active ? 'active' : 'archived');
    }
    await load();
    setManaging(null);
    showToast('Card updated');
  };

  const removeCard = async (card: ProfileCard) => {
    await deleteMyCard(card.id);
    await load();
    setManaging(null);
    showToast('Card deleted');
  };

  const changeVisibility = async (visibility: TelegramVisibility) => {
    await setTelegramVisibility(visibility);
    setState((prev) =>
      prev.status === 'ready'
        ? { status: 'ready', data: { ...prev.data, user: { ...prev.data.user, telegramVisibility: visibility } } }
        : prev,
    );
  };

  const footer = (
    <div className="relative">
      <Toast toast={toast} onHide={hideToast} />
      <BottomNav active="profile" />
    </div>
  );

  return (
    <MobileShell footer={footer}>
      <AppHeader />

      {/* 16px sides, 8px top and bottom, 16px between blocks. */}
      <div className="flex flex-col gap-4 px-4 py-2">
        <div className="flex items-center justify-between">
          <h1 className="animate-rise font-bricolage text-2xl font-extrabold text-ink motion-reduce:animate-none">Profile</h1>
          <Link
            href="/profile/edit"
            className="flex h-11 items-center gap-2 rounded-full border border-line-strong bg-white px-4 text-sm font-semibold text-ink transition hover:bg-soft active:scale-95"
          >
            <Pencil className="size-4" />
            Edit
          </Link>
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
              <ProfileHeaderCard user={state.data.user} onEditAvatar={afterSignIn} onLinkTelegram={afterSignIn} />
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
                      <MyCardItem card={card} onManage={() => setManaging(card)} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-medium text-muted">You have no cards yet. Tap + to create one.</p>
              )}
            </section>

            <section style={{ animationDelay: '350ms' }} className="flex animate-rise flex-col gap-4 motion-reduce:animate-none">
              <SectionTitle>Settings</SectionTitle>
              <SettingsPanel language={language} onLanguageChange={setLanguage} onOpenPrivacy={() => setPrivacyOpen(true)} />
            </section>

            <button
              type="button"
              onClick={afterSignIn}
              style={{ animationDelay: '420ms' }}
              className="flex h-14 animate-rise cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#F2C6D4] bg-white text-base font-extrabold text-[#C0264B] transition hover:bg-[#FFF5F8] active:scale-[0.98] motion-reduce:animate-none"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </>
        )}
      </div>

      <ManageCardSheet card={managing} onClose={() => setManaging(null)} onSave={saveCard} onDelete={removeCard} />
      {state.status === 'ready' && (
        <PrivacySheet
          open={privacyOpen}
          onClose={() => setPrivacyOpen(false)}
          telegramVisibility={state.data.user.telegramVisibility}
          onTelegramVisibilityChange={changeVisibility}
          onDownload={downloadMyData}
        />
      )}
    </MobileShell>
  );
}
