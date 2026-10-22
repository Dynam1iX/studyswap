'use client';

import { useState } from 'react';

interface UserAvatarProps {
  initials: string;
  /** Photo URL, or null for initials. */
  url: string | null;
  /** Tailwind size and text classes, e.g. "size-10 text-xs". */
  className?: string;
}

/** Round avatar: the profile photo, or the initials on lilac when there is none (or it fails to load). */
export function UserAvatar({ initials, url, className = 'size-10 text-xs' }: UserAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = url !== null && url !== failedUrl;

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F1E9FF] font-semibold text-[#6D1FC4] ${className}`}
    >
      {showPhoto ? (
        <img
          key={url}
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(url)}
          className="size-full animate-pop object-cover motion-reduce:animate-none"
        />
      ) : (
        initials
      )}
    </span>
  );
}
