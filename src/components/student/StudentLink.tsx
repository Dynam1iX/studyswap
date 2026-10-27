'use client';

import { useRef, type MouseEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMyId } from '@/lib/auth';
import type { FeedAuthor } from '@/lib/feed';
import { openStudent, rememberStudent, studentHref } from '@/lib/student';

interface StudentLinkProps {
  author: FeedAuthor;
  children: ReactNode;
  className?: string;
  /** Accessible name, e.g. "Open Alzhan Y.'s profile". */
  label: string;
  /** Called before leaving, e.g. to close the card's details sheet. */
  onNavigate?: () => void;
}

/**
 * Avatar and name of an author, leading to their page (yours: the Profile tab).
 * The element marked data-student-avatar inside flies into the profile header.
 */
export function StudentLink({ author, children, className = '', label, onNavigate }: StudentLinkProps) {
  const myId = useMyId();
  const router = useRouter();
  const ref = useRef<HTMLAnchorElement>(null);
  const href = studentHref(author.id, myId);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    rememberStudent(author);
    // New tab, new window and the like: let the browser handle the link.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate?.();
    // The avatar is inside the link (swap details) or next to it (cards).
    const avatar =
      ref.current?.querySelector<HTMLElement>('[data-student-avatar]') ??
      ref.current?.parentElement?.querySelector<HTMLElement>('[data-student-avatar]') ??
      null;
    if (href === '/profile') router.push(href);
    else openStudent(() => router.push(href), avatar);
  };

  return (
    <Link ref={ref} href={href} onClick={onClick} aria-label={label} className={className}>
      {children}
    </Link>
  );
}
