'use client';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-slate-950/80 backdrop-blur-lg mt-auto py-6">
      <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left text-xs text-gray-500 font-medium">
        <div>
          © {new Date().getFullYear()} GemIntel Systems Inc. All rights reserved.
        </div>
        <div className="text-[11px] sm:text-xs">
          Developed by <span className="text-gray-400 font-semibold">Team Ozone</span> @ University of Moratuwa
        </div>
      </div>
    </footer>
  );
}
