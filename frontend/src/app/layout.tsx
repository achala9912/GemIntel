import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'GemIntel - AI Gemstone Analysis',
  description: 'AI-based gemstone classification, authentication, valuation, and cut prediction system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${outfit.className} ${outfit.variable} min-h-screen flex flex-col`}>
        <Navbar />
        <main className="pt-16 flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
