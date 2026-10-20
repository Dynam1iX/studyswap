import { paletteFor } from '@/lib/categoryPalette';
import type { ProfileSubject } from '@/lib/profile';

interface SubjectChipProps {
  subject: ProfileSubject;
}

export function SubjectChip({ subject }: SubjectChipProps) {
  const palette = paletteFor(subject.category);

  return (
    <span
      title={subject.name}
      style={{ backgroundColor: palette.bg, color: palette.title }}
      className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold"
    >
      <span aria-hidden style={{ backgroundColor: palette.dot }} className="size-2 shrink-0 rounded-full" />
      {subject.code}
    </span>
  );
}
