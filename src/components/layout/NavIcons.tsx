import type { SVGProps } from 'react';

/** Navigation icons from /public (home, search, like, profile), drawn with currentColor. */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.9755 8.11299L13.9755 3.74199C12.8445 2.75299 11.1555 2.75299 10.0245 3.74199L5.02451 8.11299C3.99951 9.00899 3.99951 10.143 3.99951 11.007V16.003C3.99951 19.001 4.99951 20 7.99951 20H15.9995C18.9995 20 19.9995 19.001 19.9995 16.003V11.007C19.9995 10.143 19.9995 9.00899 18.9755 8.11299Z"
      />
      <path d="M9 16H15" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <path d="M11 17.5C14.5899 17.5 17.5 14.5899 17.5 11C17.5 7.41015 14.5899 4.5 11 4.5C7.41015 4.5 4.5 7.41015 4.5 11C4.5 14.5899 7.41015 17.5 11 17.5Z" />
      <path d="M16 16L20 20" />
    </svg>
  );
}

export function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 19.9928C12 19.9928 5.72303 15.9078 4.00003 11.9928C1.69803 6.76379 9.00003 1.99279 12 7.61479C15 1.99279 22.301 6.76379 20 11.9928C18.277 15.9078 12 19.9928 12 19.9928Z"
      />
    </svg>
  );
}

export function ProfileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="M12 12.3C14.0986 12.3 15.8 10.5986 15.8 8.49995C15.8 6.40127 14.0986 4.69995 12 4.69995C9.90127 4.69995 8.19995 6.40127 8.19995 8.49995C8.19995 10.5986 9.90127 12.3 12 12.3Z" />
      <path d="M4.5 20C5.3 16.4 8.3 14.5 12 14.5C15.7 14.5 18.7 16.4 19.5 20" />
    </svg>
  );
}
