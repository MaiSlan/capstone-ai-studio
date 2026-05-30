'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Terminal, LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  // Check for active user session on mount
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();

    // Listen for login/logout events automatically
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (pathname === '/auth') return null;

  return (
    <nav className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded bg-green-500 flex items-center justify-center text-zinc-950 font-bold tracking-tighter">AI</div>
          <span className="font-medium tracking-tight text-sm text-zinc-50">STUDIO // ENGINE</span>
        </Link>

        <div className="flex items-center gap-6 text-sm">
          <Link href="/architecture" className="text-zinc-400 hover:text-zinc-50 transition-colors">Architecture</Link>
          <Link href="/studio" className="text-zinc-400 hover:text-zinc-50 transition-colors">Workspace</Link>
          
          <div className="h-4 w-px bg-zinc-800 mx-2"></div>
          
          {/* Dynamic Auth Button */}
          {user ? (
            <button 
              onClick={handleSignOut} 
              className="text-zinc-400 hover:text-red-400 px-4 py-2 font-medium transition-colors flex items-center gap-2"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          ) : (
            <Link href="/auth" className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Terminal size={14} />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}