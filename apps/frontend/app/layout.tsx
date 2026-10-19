import { outfit } from '@/lib/font/outfit';
import { PJS } from '@/lib/font/plus_jakarta_sans';
import { LangProvider } from '@/lib/i18n/lang-context';
import type { Metadata } from 'next';
import '@mdxeditor/editor/style.css';
import 'style/globals.css';
import 'style/markdown-editor.css';
import 'style/print.css';
import 'style/texture.css';

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
      lang="id"
      className={`${PJS.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* One language state for the whole site; the provider syncs
            <html lang> after the stored choice loads. */}
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
