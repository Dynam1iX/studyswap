import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

/**
 * viewport-fit=cover lets the page reach the very bottom edge of the iPhone screen.
 * Without it Chrome on iOS left an empty strip under the nav (the home-indicator area);
 * the bars add env(safe-area-inset-bottom) padding so their content stays above it.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'StudySwap — Academic Barter Platform',
  description: 'Peer-to-peer knowledge sharing for AITU students',
  icons: {
    icon: '/StudySwapLogo.svg',
    shortcut: '/StudySwapLogo.svg',
    apple: '/StudySwapLogo.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Montserrat:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-page text-ink antialiased">{children}</body>
    </html>
  );
}
