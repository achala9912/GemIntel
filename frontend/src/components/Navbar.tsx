'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Identification', path: '/identification' },
  { name: 'Authentication', path: '/authentication' },
  { name: 'Valuation', path: '/valuation' },
  { name: 'Cut Prediction', path: '/cut-prediction' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

const isActive = (path: string) => {
  if (!pathname) return false;

  const current = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  const target = path === '/' ? '/' : path.replace(/\/$/, '');

  if (target === '/') {
    return current === '/';
  }

  return current === target || current.startsWith(target + '/');
};

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              GemIntel
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 h-16">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center h-full text-sm font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'text-cyan-400'
                    : 'text-gray-400 hover:text-cyan-300'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`absolute top-full left-0 right-0 z-40 border-b border-white/10 bg-slate-950 shadow-2xl shadow-black/40 overflow-hidden transition-all duration-300 lg:hidden ${
            isOpen
              ? 'max-h-96 opacity-100 py-4'
              : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-col gap-1 px-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`rounded-xl px-4 py-3.5 transition-all duration-200 font-medium ${
                  isActive(item.path)
                    ? 'text-cyan-400 bg-white/5'
                    : 'text-gray-300 hover:text-cyan-300 hover:bg-white/5'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </nav>
  );
}