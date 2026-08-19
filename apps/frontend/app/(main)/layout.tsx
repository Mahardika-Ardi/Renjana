import type { Metadata } from 'next';

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
  return <div>{children}</div>;
}
