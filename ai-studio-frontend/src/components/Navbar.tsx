'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Terminal } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  
  // Hide navbar on the auth page for a cleaner login experience
  if (pathname === '/auth') return null;

  return (
    <nav className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded bg-green-500 flex items-center justify-center text-zinc-950 font-bold tracking-tighter">AI</div>
          <span className="font-medium tracking-tight text-sm text-zinc-50">STUDIO // ENGINE</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm">
          <Link href="/architecture" className="text-zinc-400 hover:text-zinc-50 transition-colors">Architecture</Link>
          <Link href="/studio" className="text-zinc-400 hover:text-zinc-50 transition-colors">Workspace</Link>
          
          <div className="h-4 w-px bg-zinc-800 mx-2"></div>
          
          <Link href="/auth" className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <Terminal size={14} />
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}