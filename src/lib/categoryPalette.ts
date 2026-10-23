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

/** CSS variables of one palette (defined for both themes in globals.css). */
function vars(key: string): CategoryPalette {
  return {
    bg: `var(--cat-${key}-bg)`,
    label: `var(--cat-${key}-label)`,
    title: `var(--cat-${key}-title)`,
    topic: `var(--cat-${key}-topic)`,
    dot: `var(--cat-${key}-dot)`,
  };
}

/** One palette per category; the colours themselves live in globals.css (light and dark). */
export const CATEGORY_PALETTE: Record<Category, CategoryPalette> = {
  'CS & Dev': vars('cs'),
  Languages: vars('lang'),
  Humanities: vars('hum'),
  Mathematics: vars('math'),
};

/** Neutral palette for a card half before a subject is chosen (Create preview). */
export const EMPTY_PALETTE: CategoryPalette = vars('empty');

export function paletteFor(category: Category | null | undefined): CategoryPalette {
  return (category && CATEGORY_PALETTE[category]) || EMPTY_PALETTE;
}
