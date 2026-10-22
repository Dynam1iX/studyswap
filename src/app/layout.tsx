import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthGate } from '@/components/auth/AuthGate';
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Chrome on iPhone ("CriOS"): use the fixed-height layout (see MobileShell). Runs before paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "if(/CriOS/.test(navigator.userAgent))document.documentElement.classList.add('app-scroll')",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Montserrat:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-page text-ink antialiased">
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
