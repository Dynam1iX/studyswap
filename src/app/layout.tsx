import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

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
      <body className="min-h-screen bg-page text-ink antialiased">{children}</body>
    </html>
  );
}
