import Link from 'next/link';
import type { ProfileSubject } from '@/lib/profile';
import { SubjectChip } from './SubjectChip';

interface SubjectChipListProps {
  title: string;
  subjects: ProfileSubject[];
  emptyText: string;
}

/** "+ Add" leads to the Create page: subjects come from the student's cards for now. */
export function SubjectChipList({ title, subjects, emptyText }: SubjectChipListProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-bricolage text-lg font-extrabold text-ink">{title}</h2>
      <ul className="flex flex-wrap items-center gap-2">
        {subjects.map((subject) => (
          <li key={subject.id}>
            <SubjectChip subject={subject} />
          </li>
        ))}
        {subjects.length === 0 && <li className="text-sm text-muted">{emptyText}</li>}
        <li>
          <Link
            href="/create"
            className="inline-flex h-10 items-center rounded-full border border-dashed border-field px-4 text-sm font-semibold text-muted transition hover:bg-white"
          >
            + Add
          </Link>
        </li>
      </ul>
    </section>
  );
}
