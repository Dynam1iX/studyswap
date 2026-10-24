'use client';

import Link from 'next/link';
import type { ProfileSubject } from '@/lib/profile';
import { SubjectChip } from './SubjectChip';
import { useT } from '@/i18n';

interface SubjectChipListProps {
  title: string;
  subjects: ProfileSubject[];
  emptyText: string;
}

/** "+ Add" leads to the Create page: subjects come from the student's cards for now. */
export function SubjectChipList({ title, subjects, emptyText }: SubjectChipListProps) {
  const t = useT();
  return (
    <section className="flex flex-col gap-2 lg:rounded-3xl lg:border lg:border-line lg:bg-surface lg:p-5">
      <h2 className="font-bricolage text-lg font-extrabold text-ink">{title}</h2>
      <ul className="flex flex-wrap items-center gap-2">
        {subjects.map((subject, index) => (
          <li
            key={subject.id}
            style={{ animationDelay: `${index * 60}ms` }}
            className="animate-pop motion-reduce:animate-none"
          >
            <SubjectChip subject={subject} />
          </li>
        ))}
        {subjects.length === 0 && <li className="text-sm text-muted">{emptyText}</li>}
        <li>
          <Link
            href="/create"
            className="inline-flex h-10 items-center rounded-full border border-dashed border-field px-4 text-sm font-semibold text-muted transition hover:border-brand-from hover:bg-surface hover:text-brand-ink active:scale-95"
          >
            {t.profile.add}
          </Link>
        </li>
      </ul>
    </section>
  );
}
