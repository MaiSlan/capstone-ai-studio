'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ChevronDown, Shield, Sparkles, BookHeart, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [tokens, setTokens] = useState<number | null>(null);
  const [isArchOpen, setIsArchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('role, tokens').eq('id', userId).single();
      if (data) {
        setUserRole(data.role);
        setTokens(data.tokens);
      }
    };

    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchUserData(session.user.id);
      }
    };
    
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setUserRole('user');
        setTokens(null);
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsArchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      authListener.subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pathname]); // Re-fetch if route changes to keep tokens fresh

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (pathname === '/auth') return null;

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center w-full px-4 pointer-events-none">
      <nav className="pointer-events-auto w-full max-w-5xl bg-white/80 backdrop-blur-md border border-pink-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-full px-6 h-16 flex items-center justify-between transition-all duration-300">
        
        {/* BRANDING */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded-xl bg-pink-100 flex items-center justify-center text-pink-500 shadow-sm">
            <Sparkles size={16} />
          </div>
          <span className="font-bold text-lg text-pink-500 tracking-wide" style={{ fontFamily: '"Fredoka", sans-serif' }}>
            Flufforia
          </span>
        </Link>

        {/* LINKS */}
        <div className="flex items-center gap-6 text-sm font-medium">
          
          <div className="relative py-2" ref={dropdownRef}>
            <button 
              onClick={() => setIsArchOpen(!isArchOpen)}
              className={`flex items-center gap-1.5 transition-colors focus:outline-none ${isArchOpen ? 'text-pink-500' : 'text-zinc-500 hover:text-pink-400'}`}
            >
              Documentation
              <ChevronDown size={14} className={`transition-transform duration-200 ${isArchOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isArchOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 bg-white border border-pink-100 rounded-2xl shadow-xl flex flex-col overflow-hidden z-50 py-2">
                <Link href="/architecture" onClick={() => setIsArchOpen(false)} className="px-4 py-2.5 text-xs font-semibold text-zinc-500 hover:bg-pink-50 hover:text-pink-500 transition-colors">
                  System Overview
                </Link>
                <Link href="/architecture/workflow" onClick={() => setIsArchOpen(false)} className="px-4 py-2.5 text-xs font-semibold text-zinc-500 hover:bg-pink-50 hover:text-pink-500 transition-colors">
                  Tensor Graph
                </Link>
              </div>
            )}
          </div>

          <Link href="/creations" className="text-zinc-500 hover:text-pink-400 transition-colors">My Creations</Link>
          <Link href="/studio" className="text-zinc-500 hover:text-pink-400 transition-colors">Studio</Link>

          {userRole === 'admin' && (
            <Link href="/admin" className="text-zinc-400 hover:text-purple-500 transition-colors flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-100">
              <Shield size={12} /> Admin
            </Link>
          )}

          <div className="h-6 w-px bg-pink-100 mx-1"></div>
          
          {/* AUTH & TOKENS */}
          {user ? (
            <div className="flex items-center gap-3">
              {tokens !== null && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-pink-500 bg-pink-50 px-3 py-1.5 rounded-full">
                  <Sparkles size={12} /> {tokens}
                </span>
              )}
              <button onClick={handleSignOut} className="text-zinc-400 hover:text-red-400 p-2 transition-colors flex items-center justify-center rounded-full hover:bg-red-50">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link href="/auth" className="bg-pink-400 hover:bg-pink-500 text-white px-5 py-2 rounded-full transition-all shadow-[0_2px_0_rgba(244,114,182,0.4)] hover:translate-y-[1px] flex items-center gap-2">
              <User size={14} /> Sign In
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}