/**
 * Every card has its own link: /c/<teaches>-za-<needs>-<code>, e.g.
 * /c/linear-algebra-za-cultural-studies-3f9a2c41. The code is the first 8 hex
 * characters of the card id; the words are only there to be readable.
 */

/** Production address, used where the browser's own address is not available. */
export const SITE_URL = 'https://studyswap-phi.vercel.app';

const CODE_LENGTH = 8;

/** "Introduction to Programming 1" -> "introduction-to-programming-1". */
function slugify(text: string | null | undefined): string {
  return (text ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
}

interface LinkableCard {
  id: string;
  needed?: { name: string } | null;
  offered?: { name: string } | null;
}

/** "/c/linear-algebra-za-cultural-studies-3f9a2c41" */
export function cardPath(card: LinkableCard): string {
  const words = [slugify(card.offered?.name), 'za', slugify(card.needed?.name)].filter(Boolean).join('-');
  return `/c/${words}-${card.id.slice(0, CODE_LENGTH)}`;
}

/** Full link, on the address the site is open at (previews link to themselves). */
export function cardUrl(card: LinkableCard): string {
  const origin = typeof window === 'undefined' ? SITE_URL : window.location.origin;
  return origin + cardPath(card);
}

/** The card code at the end of a /c/ slug, or null when it is not one. */
export function parseCardCode(slug: string): string | null {
  // The router has already decoded the slug; decoding again throws on a "%".
  const code = slug.split('-').pop()?.toLowerCase() ?? '';
  return /^[0-9a-f]{8}$/.test(code) ? code : null;
}
