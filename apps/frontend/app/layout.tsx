import { outfit } from '@/lib/font/outfit';
import { PJS } from '@/lib/font/plus_jakarta_sans';
import type { Metadata } from 'next';
import 'style/globals.css';

export const metadata: Metadata = {
  title: 'Renjana',
  description:
    'Your private digital space to intentionally grow and invest in your relationship.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${PJS.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
