'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Sparkles, ArrowRight, Loader2, AlertCircle, KeyRound } from 'lucide-react';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('flufforia-theme');
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // The user is authenticated via the email link, so we can securely update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;
      
      // Successfully updated! Send them directly to the studio
      router.refresh();
      setTimeout(() => { router.push('/studio'); }, 100);

    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try the reset link again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FFFAF0] dark:bg-zinc-950 transition-colors duration-700 bg-[repeating-linear-gradient(to_right,transparent,transparent_40px,rgba(251,113,133,0.03)_40px,rgba(251,113,133,0.03)_80px)] dark:bg-[linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b),linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b)] dark:bg-[length:20px_20px] dark:bg-[position:0_0,10px_10px]">
      
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-pink-100 dark:bg-purple-900/50 flex items-center justify-center text-pink-500 dark:text-purple-400 shadow-sm transform -rotate-3 transition-colors">
            <KeyRound size={32} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/90 backdrop-blur-md rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(168,85,247,0.05)] border border-pink-100 dark:border-purple-500/30 transition-all duration-700">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 transition-colors" style={{ fontFamily: '"Fredoka", sans-serif' }}>
              Set New Password
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 transition-colors">
              Please enter a strong new password for your account.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-500 dark:text-red-400 rounded-2xl flex items-center gap-3 text-sm font-medium transition-colors">
              <AlertCircle size={18} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 pl-1 transition-colors">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-pink-300 dark:focus:border-purple-500 transition-colors disabled:opacity-50"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading || newPassword.length < 6}
              className="w-full mt-2 bg-pink-400 dark:bg-purple-600 hover:bg-pink-500 dark:hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_0_rgba(244,114,182,0.4)] dark:shadow-[0_4px_0_rgba(147,51,234,0.4)] hover:translate-y-[2px]"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Updating...</>
              ) : (
                <>Save & Continue <ArrowRight size={20} /></>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}