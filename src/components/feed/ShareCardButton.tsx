'use client';

import { useEffect, useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { cardUrl } from '@/lib/cardLink';
import { useT } from '@/i18n';

interface ShareCardButtonProps {
  card: { id: string; needed?: { name: string } | null; offered?: { name: string } | null };
  className?: string;
}

/** Copies the card's own link; the icon turns into a tick for a moment. */
export function ShareCardButton({ card, className = '' }: ShareCardButtonProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl(card));
      setCopied(true);
    } catch {
      // Clipboard blocked: nothing to undo.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={t.card.shareCard}
      title={copied ? t.card.cardLinkCopied : t.card.shareCard}
      className={`relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition active:scale-90 focus-visible:outline-2 focus-visible:outline-brand-from ${
        copied ? 'bg-success-soft text-success' : 'bg-soft text-ink hover:bg-line'
      } ${className}`}
    >
      {copied ? (
        <Check key="ok" className="size-5 animate-pop motion-reduce:animate-none" strokeWidth={2.8} />
      ) : (
        <Link2 key="link" className="size-5" strokeWidth={2.4} />
      )}
      <span aria-live="polite" className="sr-only">
        {copied ? t.card.cardLinkCopied : ''}
      </span>
    </button>
  );
}
