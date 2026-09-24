import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Hiffs Connect | Business Messaging Platform',
    template: '%s | Hiffs Connect',
  },

  description:
    'Reliable SMS, messaging APIs, sender management and delivery reporting for businesses across Africa and beyond.',

  applicationName: 'Hiffs Connect',

  keywords: [
    'business messaging',
    'bulk SMS',
    'SMS API',
    'Ghana SMS',
    'Nigeria SMS',
    'customer messaging',
    'transactional messaging',
  ],

  openGraph: {
    title: 'Hiffs Connect',
    description:
      'Reliable business messaging infrastructure for growing companies.',
    type: 'website',
    siteName: 'Hiffs Connect',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Hiffs Connect',
    description:
      'Reliable business messaging infrastructure for growing companies.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}