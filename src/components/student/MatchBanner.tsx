'use client';

import { Sparkles } from 'lucide-react';
import { SubjectChip } from '@/components/profile/SubjectChip';
import type { ProfileSubject } from '@/lib/profile';
import { ExchangeIcon } from '@/components/ui/ExchangeIcon';
import { useT } from '@/i18n';

interface MatchBannerProps {
  /** They teach what you need. */
  theyHelp: ProfileSubject[];
  /** You teach what they need. */
  youHelp: ProfileSubject[];
}

function Row({ title, subjects }: { title: string; subjects: ProfileSubject[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-ink">{title}:</p>
      <ul className="flex flex-wrap gap-2">
        {subjects.map((subject, index) => (
          <li
            key={subject.id}
            style={{ animationDelay: `${200 + index * 60}ms` }}
            className="animate-pop motion-reduce:animate-none"
          >
            <SubjectChip subject={subject} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "Can help you with" / "You can help with", or both: a perfect swap. Hidden when nothing matches. */
export function MatchBanner({ theyHelp, youHelp }: MatchBannerProps) {
  const t = useT();
  if (theyHelp.length === 0 && youHelp.length === 0) return null;
  const perfect = theyHelp.length > 0 && youHelp.length > 0;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-from to-brand-to p-[1.5px] shadow-[0_10px_28px_rgba(173,70,255,0.22)]">
      <div className="shine relative flex flex-col gap-3 rounded-[calc(1.5rem-1.5px)] bg-surface p-4">
        <p className="flex items-center gap-2 font-bricolage text-[17px] font-extrabold">
          {perfect ? (
            <ExchangeIcon className="size-7 shrink-0 animate-[spin_1.2s_cubic-bezier(0.34,1.56,0.64,1)_1] motion-reduce:animate-none" />
          ) : (
            <Sparkles aria-hidden className="size-5 shrink-0 animate-pop text-brand-from motion-reduce:animate-none" strokeWidth={2.4} />
          )}
          <span className="bg-linear-to-r from-brand-text-from to-brand-text-to bg-clip-text text-transparent">
            {perfect ? t.student.perfectMatch : theyHelp.length > 0 ? t.student.canHelpYou : t.student.youCanHelp}
          </span>
        </p>
        {perfect ? (
          <>
            <Row title={t.student.canHelpYou} subjects={theyHelp} />
            <Row title={t.student.youCanHelp} subjects={youHelp} />
          </>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {(theyHelp.length > 0 ? theyHelp : youHelp).map((subject, index) => (
              <li
                key={subject.id}
                style={{ animationDelay: `${200 + index * 60}ms` }}
                className="animate-pop motion-reduce:animate-none"
              >
                <SubjectChip subject={subject} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
