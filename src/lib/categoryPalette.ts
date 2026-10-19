import type { Category } from '@/types/database';

export interface CategoryPalette {
  /** Card half and chip background. */
  bg: string;
  /** Small caps label ("NEEDS HELP", "CAN TEACH"). */
  label: string;
  /** Subject name. */
  title: string;
  /** Topics line under the subject name. */
  topic: string;
  /** Dot next to the subject in chips and selects. */
  dot: string;
}

/** One palette per category. The only place these colours live. */
export const CATEGORY_PALETTE: Record<Category, CategoryPalette> = {
  'CS & Dev': { bg: '#D9E1F1', label: '#274CB1', title: '#1E3A8A', topic: '#4065BB', dot: '#4065BB' },
  Languages: { bg: '#FDD5DA', label: '#9E1842', title: '#881337', topic: '#BE1F52', dot: '#9E1842' },
  Humanities: { bg: '#FDEAE2', label: '#994716', title: '#78350F', topic: '#C35F20', dot: '#994716' },
  Mathematics: { bg: '#CBC2F7', label: '#5B24B1', title: '#4C1D95', topic: '#6D2ED6', dot: '#6D2ED6' },
};

/** Neutral palette for a card half before a subject is chosen (Create preview). */
export const EMPTY_PALETTE: CategoryPalette = {
  bg: '#F3EFFC',
  label: '#736A8E',
  title: '#2F274B',
  topic: '#5A5472',
  dot: '#A09BB5',
};

export function paletteFor(category: Category | null | undefined): CategoryPalette {
  return (category && CATEGORY_PALETTE[category]) || EMPTY_PALETTE;
}
