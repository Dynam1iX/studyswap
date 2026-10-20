import { Check } from 'lucide-react';
import type { ProfileUser } from '@/lib/profile';
import { Avatar } from './Avatar';

interface ProfileHeaderCardProps {
  user: ProfileUser;
  onEditAvatar?: () => void;
}

export function ProfileHeaderCard({ user, onEditAvatar }: ProfileHeaderCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-4">
      <div className="flex items-center gap-4">
        <Avatar initials={user.initials} onEdit={onEditAvatar} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate font-bricolage text-2xl font-extrabold text-ink">{user.displayName}</p>
          <p className="text-sm font-medium text-muted">
            {user.major}, Year {user.studyYear}
          </p>
        </div>
      </div>

      {user.telegramHandle ? (
        <a
          href={`https://t.me/${user.telegramHandle}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-12 items-center justify-between rounded-2xl bg-soft px-3.5 transition hover:bg-line"
        >
          <span className="flex items-center gap-2.5 text-base font-semibold text-ink">
            <img src="/telegram-circle.svg" alt="" className="size-7 shrink-0" />@{user.telegramHandle}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
            <Check className="size-3.5" strokeWidth={3} />
            Linked
          </span>
        </a>
      ) : (
        <div className="flex h-12 items-center rounded-2xl border border-dashed border-field px-3.5 text-sm font-semibold text-muted">
          Telegram is not linked yet
        </div>
      )}
    </div>
  );
}
