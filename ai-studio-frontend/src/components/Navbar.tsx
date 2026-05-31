'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Terminal, LogOut, ChevronDown, Shield } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [isArchOpen, setIsArchOpen] = useState(false); // Tracks dropdown state
  const dropdownRef = useRef<HTMLDivElement>(null); // Used to detect outside clicks

  // Check for active user session on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      setUser(authData.user);
      
      if (authData.user) {
        // Fetch the role
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single();
        if (profile) setUserRole(profile.role);
      }
    };
    getUser();

    // Listen for login/logout events automatically
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    // Event listener to close dropdown when clicking outside of it
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
          
          {/* Architecture Click Dropdown */}
          <div className="relative py-2" ref={dropdownRef}>
            <button 
              onClick={() => setIsArchOpen(!isArchOpen)}
              className={`flex items-center gap-1.5 transition-colors focus:outline-none ${isArchOpen ? 'text-zinc-50' : 'text-zinc-400 hover:text-zinc-50'}`}
            >
              Architecture
              <ChevronDown size={14} className={`transition-transform duration-200 ${isArchOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Conditional Rendering of the Dropdown Menu */}
            {isArchOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl flex flex-col overflow-hidden z-50">
                <Link 
                  href="/architecture" 
                  onClick={() => setIsArchOpen(false)} // Close menu on click
                  className="px-4 py-3 text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50 border-b border-zinc-800/50"
                >
                  System Overview
                </Link>
                <Link 
                  href="/architecture/workflow" 
                  onClick={() => setIsArchOpen(false)} // Close menu on click
                  className="px-4 py-3 text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50"
                >
                  ComfyUI Tensor Graph
                </Link>
              </div>
            )}
          </div>

          {/* Admin Link (Only visible to admins) */}
          {userRole === 'admin' && (
            <Link href="/admin" className="text-zinc-400 hover:text-green-400 font-medium transition-colors flex items-center gap-1.5">
              <Shield size={14} /> Admin
            </Link>
          )}

          <Link href="/studio" className="text-zinc-400 hover:text-zinc-50 transition-colors">Workspace</Link>

          <Link href="/studio" className="text-zinc-400 hover:text-zinc-50 transition-colors">Workspace</Link>
          
          <div className="h-4 w-px bg-zinc-800 mx-2"></div>
          
          {/* Dynamic Auth Button */}
          {user ? (
            <button 
              onClick={handleSignOut} 
              className="text-zinc-400 hover:text-red-400 px-4 py-2 font-medium transition-colors flex items-center gap-2 focus:outline-none"
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