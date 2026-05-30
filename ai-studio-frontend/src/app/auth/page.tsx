'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        // Handle Sign Up
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        // FIX: Switch to Sign In mode automatically and show a success message
        setIsSignUp(false);
        setPassword(''); // Clear the password for security
        setSuccess('Account initialized successfully. Please authenticate to enter the workspace.');
      } else {
        // Handle Sign In
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        router.push('/studio');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <Link href="/" className="absolute top-8 left-8 text-zinc-500 hover:text-zinc-300 flex items-center gap-2 text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Engine
      </Link>

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-8 w-8 rounded bg-green-500 flex items-center justify-center text-zinc-950 font-bold tracking-tighter">AI</div>
          <span className="font-medium tracking-tight text-xl text-zinc-50">STUDIO</span>
        </div>

        <h2 className="text-2xl font-semibold text-center mb-2">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-zinc-400 text-sm text-center mb-8">
          {isSignUp ? 'Get 10 free generation tokens upon signup.' : 'Sign in to access your workspace and tokens.'}
        </p>

        {/* Dynamic Feedback Banners */}
        {error && <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-sm p-3 rounded-lg mb-4 text-center">{error}</div>}
        {success && <div className="bg-green-950/30 border border-green-900/50 text-green-400 text-sm p-3 rounded-lg mb-4 text-center">{success}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors text-zinc-100"
              placeholder="operator@system.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors text-zinc-100"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-zinc-950 font-bold text-sm py-3 px-4 rounded-lg transition-all mt-4 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Initialize Account' : 'Authenticate')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-500">
          {isSignUp ? 'Already have access? ' : 'Need an authorization key? '}
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null); }} 
            className="text-green-500 hover:text-green-400 font-medium transition-colors"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}