'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, Coins, Search, Edit2, Check, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Profile {
  id: string;
  email: string;
  tokens: number;
  role: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTokenValue, setEditTokenValue] = useState<number>(0);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const verifyAdminAndFetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth');
        return;
      }

      // Check if user is actually an admin
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      
      if (profile?.role !== 'admin') {
        router.push('/studio'); // Kick unauthorized users back to the workspace
        return;
      }

      // Fetch all users
      const { data: allProfiles, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      
      if (allProfiles) {
        setProfiles(allProfiles);
      }
      setLoading(false);
    };

    verifyAdminAndFetchData();
  }, [router, supabase]);

  const handleSaveTokens = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ tokens: editTokenValue }).eq('id', userId);
    
    if (!error) {
      setProfiles(profiles.map(p => p.id === userId ? { ...p, tokens: editTokenValue } : p));
    }
    setEditingId(null);
  };

  if (!mounted || loading) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-zinc-500">
      Authenticating clearance...
    </div>
  );

  const totalTokensInEconomy = profiles.reduce((sum, p) => sum + p.tokens, 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8 border-b border-zinc-800 pb-8">
        <div className="h-12 w-12 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-zinc-50 tracking-tight">Command Center</h1>
          <p className="text-zinc-400">System administration and economy oversight.</p>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-zinc-400 mb-2 font-medium text-sm uppercase tracking-wider">
            <Users size={16} /> Total Operators
          </div>
          <div className="text-3xl font-bold text-zinc-50">{profiles.length}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-zinc-400 mb-2 font-medium text-sm uppercase tracking-wider">
            <Coins size={16} /> Active Tokens
          </div>
          <div className="text-3xl font-bold text-zinc-50">{totalTokensInEconomy}</div>
        </div>
      </div>

      {/* User Directory */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Operator Directory</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                <th className="p-4 font-medium">Email / ID</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Joined</th>
                <th className="p-4 font-medium">Token Balance</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-zinc-200">{profile.email}</div>
                    <div className="text-[10px] text-zinc-600 font-mono mt-0.5">{profile.id}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest border ${
                      profile.role === 'admin' ? 'bg-green-950/30 border-green-900/50 text-green-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}>
                      {profile.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-zinc-400">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    {editingId === profile.id ? (
                      <input 
                        type="number" 
                        value={editTokenValue}
                        onChange={(e) => setEditTokenValue(Number(e.target.value))}
                        className="w-20 bg-zinc-950 border border-green-500 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none"
                      />
                    ) : (
                      <span className="font-mono text-zinc-300 bg-zinc-950 px-3 py-1.5 rounded-md border border-zinc-800">
                        {profile.tokens}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {editingId === profile.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleSaveTokens(profile.id)} className="p-1.5 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30 transition-colors">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setEditingId(profile.id); setEditTokenValue(profile.tokens); }}
                        className="p-1.5 text-zinc-500 hover:text-green-400 transition-colors"
                        title="Edit Tokens"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}