import type { Messages } from '@/i18n';

/** "Alzhan Yerzhanuly" -> "AY", "Alzhan" -> "AL", empty -> "ST". */
export function getInitials(name?: string | null): string {
  if (!name) return 'ST';
  const [first, second] = name.trim().split(/\s+/);
  if (first && second) return `${first[0]}${second[0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** "Alzhan Yerzhanuly" -> "Alzhan Y." */
export function getShortName(name: string): string {
  const [first, second] = name.trim().split(/\s+/);
  return first && second ? `${first} ${second[0]}.` : name;
}

/**
 * "Software Engineering, Year 1" (the year in the interface language).
 * No year means a teacher: "Software Engineering, Teacher".
 */
export function formatStudyInfo(t: Messages, major?: string | null, year?: number | null): string {
  return `${major || 'Software Engineering'}, ${year ? t.common.year(year) : t.common.teacher}`;
}

/** "2026-10-14T01:45:37Z" -> "14 Oct 2026, 06:45" in the viewer's time zone and language. */
export function formatPostedAt(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}
