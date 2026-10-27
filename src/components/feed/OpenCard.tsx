'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { parseCardCode } from '@/lib/cardLink';

/** /c/<slug>: goes to the Feed, which opens this card's details. */
export function OpenCard() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  useEffect(() => {
    const code = parseCardCode(slug);
    router.replace(code ? `/?card=${code}` : '/');
  }, [slug, router]);
  return null;
}
