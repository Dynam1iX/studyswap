import type { CSSProperties } from 'react';

const SQUARES = [
  { color: '#F25022', dx: -4, dy: -4 },
  { color: '#7FBA00', dx: 4, dy: -4 },
  { color: '#00A4EF', dx: -4, dy: 4 },
  { color: '#FFB900', dx: 4, dy: 4 },
];

/** The four-square Microsoft logo; with `loading` the squares scatter and orbit (styles in globals.css). */
export function MicrosoftLogo({ loading = false }: { loading?: boolean }) {
  return (
    <span aria-hidden className={`ms-logo shrink-0 ${loading ? 'is-loading' : ''}`}>
      {SQUARES.map((square) => (
        <span
          key={square.color}
          style={{ backgroundColor: square.color, '--dx': `${square.dx}px`, '--dy': `${square.dy}px` } as CSSProperties}
        />
      ))}
    </span>
  );
}
