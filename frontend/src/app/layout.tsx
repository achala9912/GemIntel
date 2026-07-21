import type { Metadata } from 'next';
import { Outfit, Orbitron } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-outfit',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  display: 'swap',
  variable: '--font-orbitron',
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
      <body suppressHydrationWarning className={`${outfit.className} ${outfit.variable} ${orbitron.variable} min-h-screen flex flex-col`}>
        <Navbar />
        <main className="pt-16 flex-1 flex flex-col bg-grid-dots relative overflow-hidden">
          {/* Background Ambient Decor */}
          <div className="fixed -top-40 -right-40 h-96 w-96 rounded-full bg-blue-600/5 blur-[120px] pointer-events-none z-0" />
          <div className="fixed -bottom-40 -left-40 h-96 w-96 rounded-full bg-cyan-600/5 blur-[120px] pointer-events-none z-0" />
          <div className="relative z-10 flex-1 flex flex-col">
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
