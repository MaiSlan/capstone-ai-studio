'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Sparkles, ArrowRight, Loader2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Upgraded from a boolean to support 3 distinct views
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('flufforia-theme');
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (view === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.refresh();
        setTimeout(() => { router.push('/studio'); }, 100);

      } else if (view === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setMessage('Registration successful! Please check your email to verify your account.');
        setView('login'); 

      } else if (view === 'forgot') {
        // Send the reset email, and tell the callback to route them to the update page!
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
        });
        if (resetError) throw resetError;
        setMessage('Password reset link sent! Please check your inbox.');
        setView('login');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FFFAF0] dark:bg-zinc-950 transition-colors duration-700 bg-[repeating-linear-gradient(to_right,transparent,transparent_40px,rgba(251,113,133,0.03)_40px,rgba(251,113,133,0.03)_80px)] dark:bg-[linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b),linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b)] dark:bg-[length:20px_20px] dark:bg-[position:0_0,10px_10px]">
      
      <Link 
        href="/" 
        className="absolute top-8 left-8 text-zinc-500 dark:text-zinc-400 hover:text-pink-500 dark:hover:text-purple-400 flex items-center gap-2 text-sm font-medium transition-colors bg-white/50 dark:bg-zinc-900/50 backdrop-blur px-4 py-2 rounded-full border border-pink-100 dark:border-zinc-800 shadow-sm"
      >
        <ArrowLeft size={16} /> Back to Hub
      </Link>

      <div className="w-full max-w-md animate-fade-in">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-pink-100 dark:bg-purple-900/50 flex items-center justify-center text-pink-500 dark:text-purple-400 shadow-sm transform -rotate-3 transition-colors">
            <Sparkles size={32} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/90 backdrop-blur-md rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(168,85,247,0.05)] border border-pink-100 dark:border-purple-500/30 transition-all duration-700">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 transition-colors" style={{ fontFamily: '"Fredoka", sans-serif' }}>
              {view === 'login' ? 'Welcome Back' : view === 'signup' ? 'Join Flufforia' : 'Reset Password'}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 transition-colors">
              {view === 'login' ? 'Sign in to access your magical studio.' 
                : view === 'signup' ? 'Create an account to start drafting characters.'
                : 'Enter your email to receive a secure reset link.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-500 dark:text-red-400 rounded-2xl flex items-center gap-3 text-sm font-medium transition-colors">
              <AlertCircle size={18} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 text-green-600 dark:text-green-400 rounded-2xl flex items-center gap-3 text-sm font-medium transition-colors">
              <Sparkles size={18} className="shrink-0" />
              <p>{message}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 pl-1 transition-colors">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-pink-300 dark:focus:border-purple-500 transition-colors disabled:opacity-50"
                placeholder="you@example.com"
              />
            </div>

            {/* Only show password field if they are trying to log in or sign up */}
            {view !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-2 pl-1 pr-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 transition-colors">
                    Password
                  </label>
                  {view === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => { setView('forgot'); setError(null); setMessage(null); }}
                      className="text-xs font-medium text-pink-400 dark:text-purple-400 hover:text-pink-500 dark:hover:text-purple-300 transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-pink-300 dark:focus:border-purple-500 transition-colors disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-pink-400 dark:bg-purple-600 hover:bg-pink-500 dark:hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_0_rgba(244,114,182,0.4)] dark:shadow-[0_4px_0_rgba(147,51,234,0.4)] hover:translate-y-[2px]"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Processing...</>
              ) : view === 'forgot' ? (
                <>Send Reset Link <KeyRound size={18} /></>
              ) : (
                <>{view === 'login' ? 'Enter Studio' : 'Create Account'} <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          {/* Toggle between Login and Signup */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => { 
                setView(view === 'login' ? 'signup' : 'login'); 
                setError(null); 
                setMessage(null); 
              }}
              disabled={loading}
              className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-pink-500 dark:hover:text-purple-400 transition-colors"
            >
              {view === 'login' 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}