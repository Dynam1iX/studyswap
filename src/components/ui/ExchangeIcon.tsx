import { useId, type CSSProperties } from 'react';

/**
 * The ⇄ swap badge from Figma, drawn inline so its outer ring takes the card colour
 * (white in the light theme, the dark surface at night) instead of a fixed white.
 */
export function ExchangeIcon({ className, style, label }: { className?: string; style?: CSSProperties; label?: string }) {
  const gradient = useId();
  return (
    <svg
      viewBox="0 0 51 51"
      fill="none"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
      style={style}
    >
      <circle cx="25.5" cy="25.5" r="25.5" fill="var(--color-surface)" />
      <circle cx="25.5" cy="25.5" r="20.2" fill={`url(#${gradient})`} />
      <path
        d="M22.5 33.8333L18.5 29.8333L22.5 25.8333M18.5 29.8333H32.5M28.5 25.1667L32.5 21.1667L28.5 17.1667M32.5 21.1667H18.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id={gradient} x1="5.3" y1="25.5" x2="45.7" y2="25.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#AD46FF" />
          <stop offset="1" stopColor="#F6339A" />
        </linearGradient>
      </defs>
    </svg>
  );
}
