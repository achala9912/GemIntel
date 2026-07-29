import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
  title: 'GemIntel - Precision Gemstone Analysis',
  description: 'Advanced gemstone classification, authentication, valuation, and cut prediction system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${plusJakartaSans.className} ${plusJakartaSans.variable} min-h-screen flex flex-col antialiased bg-[#080C14] text-slate-100`}>
        <Navbar />
        <main className="pt-16 flex-1 flex flex-col relative">
          <div className="relative z-10 flex-1 flex flex-col">
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
}

