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

/** "Software Engineering, Year 1" */
export function formatStudyInfo(major?: string | null, year?: number | null): string {
  return `${major || 'Software Engineering'}, Year ${year || 1}`;
}
