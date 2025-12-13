import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FlashPrint - College Printing Service',
  description:
    'Fast, reliable, and affordable printing service for students, faculty, and staff. Upload your documents and get them delivered to your doorstep.',
  keywords: ['printing', 'xerox', 'college', 'university', 'documents', 'PDF'],
  authors: [{ name: 'FlashPrint' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
