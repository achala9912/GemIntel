'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Gem } from 'lucide-react';

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'About Us', path: '/about' },
  { name: 'Feedback', path: '/feedback' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

const isActive = (path: string) => {
  if (!pathname) return false;

  const current = pathname.replace(/\/$/, '');
  const target = path.replace(/\/$/, '');

  if (target === '/') {
    return current === '/';
  }

  return current === target;
};

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isOpen ? 'bottom-0' : 'h-16'}`}>
      
      {/* Header Bar Background & Content */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-lg border-b border-white/10 z-50 flex justify-center">
        <div className="max-width-container h-full">
          <div className="flex h-full items-center justify-between">

            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center gap-2.5 text-xl font-bold tracking-widest group"
              onClick={() => {
                sessionStorage.setItem('active_portal', 'home');
                window.dispatchEvent(new CustomEvent('nav-home'));
              }}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-400 group-hover:bg-blue-600/25 transition-all">
                <Gem className="w-4.5 h-4.5" />
              </div>
              <span 
                className="text-slate-100 font-extrabold uppercase tracking-wider text-lg"
              >
                GemIntel
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-6 h-16">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => {
                    if (item.path === '/') {
                      sessionStorage.setItem('active_portal', 'home');
                      window.dispatchEvent(new CustomEvent('nav-home'));
                    }
                  }}
                  className={`flex items-center h-full text-sm font-semibold transition-colors duration-200 ${
                    isActive(item.path)
                      ? '!text-blue-400'
                      : '!text-slate-400 hover:!text-slate-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile Button */}
            <button
              className="lg:hidden text-white"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop Blur Overlay for Mobile Menu */}
      <div
        className={`absolute inset-0 top-16 z-30 bg-black/60 backdrop-blur-md transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Menu */}
      <div
        className={`absolute top-16 left-0 right-0 z-40 border-b border-white/10 bg-slate-950 shadow-2xl overflow-hidden transition-all duration-300 lg:hidden ${
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
              onClick={() => {
                setIsOpen(false);
                if (item.path === '/') {
                  sessionStorage.setItem('active_portal', 'home');
                  window.dispatchEvent(new CustomEvent('nav-home'));
                }
              }}
              className={`rounded-xl px-4 py-3.5 transition-all duration-200 font-semibold ${
                isActive(item.path)
                  ? '!text-blue-400 bg-slate-800/60'
                  : '!text-slate-300 hover:!text-white hover:bg-slate-800/40'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>

    </nav>
  );
}