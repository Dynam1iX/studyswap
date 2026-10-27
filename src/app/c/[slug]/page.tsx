import { Suspense } from 'react';
import type { Metadata } from 'next';
import { OpenCard } from '@/components/feed/OpenCard';
import { parseCardCode } from '@/lib/cardLink';
import { fetchCardPreview } from '@/lib/cardPreview';

type Props = { params: Promise<{ slug: string }> };

/** Title and description of the link preview (the picture comes from opengraph-image). */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const code = parseCardCode(slug);
  const card = code ? await fetchCardPreview(code) : null;
  if (!card) {
    return { title: 'StudySwap — Academic Barter Platform', description: 'Peer-to-peer knowledge sharing for AITU students' };
  }
  const title = `${card.offered_name} ⇄ ${card.needed_name} · StudySwap`;
  const description = `${card.author_name} can teach ${card.offered_name} and needs help with ${card.needed_name}.`;
  return {
    title,
    description,
    openGraph: { title, description, siteName: 'StudySwap', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/** A card's own link: opens the Feed with this card's details on top. */
export default function CardPage() {
  return (
    <Suspense fallback={null}>
      <OpenCard />
    </Suspense>
  );
}
