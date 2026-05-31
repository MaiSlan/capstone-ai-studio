'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, Coins, Edit2, Check, X, Trash2, Activity, List, LayoutDashboard, Terminal } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Profile {
  id: string;
  email: string;
  tokens: number;
  role: string;
  created_at: string;
}

interface Generation {
  id: string;
  theme: string;
  lore: string;
  optimized_prompt: string;
  created_at: string;
  profiles: { email: string };
}

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [monthlyCompute, setMonthlyCompute] = useState<number>(0);
  const [financialSpend, setFinancialSpend] = useState<number>(0);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'directory' | 'ledger'>('directory');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTokenValue, setEditTokenValue] = useState<number>(0);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const verifyAdminAndFetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') { router.push('/studio'); return; }

      // 1. Fetch Users
      const { data: allProfiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (allProfiles) setProfiles(allProfiles);

      // 2. Fetch Modal Telemetry (Generations this month)
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count } = await supabase.from('generations').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth);
      setMonthlyCompute(count || 0);

      // 3. Fetch Global Ledger
      const { data: ledgerData } = await supabase.from('generations')
        .select('id, theme, lore, optimized_prompt, created_at, profiles(email)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (ledgerData) setGenerations(ledgerData as any);

      setLoading(false);

      // 4. Fetch FinOps Telemetry (IN THE BACKGROUND)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const billingRes = await fetch('https://capstone-ai-studio.onrender.com/api/v1/admin/billing', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          
          if (billingRes.ok) {
            const parsedData = await billingRes.json();
            
            console.log("💰 RAW MODAL FINOPS DATA:", parsedData.data);
            
            let totalSpend = 0;
            if (parsedData.data && Array.isArray(parsedData.data)) {
              totalSpend = parsedData.data.reduce((sum: number, item: any) => {
                const itemCost = item.cost || item.total_cost || item.amount || item.usage || item.spend || item.total || 0;
                return sum + parseFloat(itemCost);
              }, 0);
            }
            setFinancialSpend(totalSpend);
          }
        } catch (e) {
          console.error("FinOps Telemetry failed to load:", e);
        }
      }
    };

    verifyAdminAndFetchData();
  }, [router, supabase]);

  const handleSaveTokens = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ tokens: editTokenValue }).eq('id', userId);
    if (!error) setProfiles(profiles.map(p => p.id === userId ? { ...p, tokens: editTokenValue } : p));
    setEditingId(null);
  };

  const handleDeleteUser = async (userId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    try {
      const res = await fetch(`https://capstone-ai-studio.onrender.com/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      
      setProfiles(profiles.filter(p => p.id !== userId));
      setUserToDelete(null);
    } catch (error: any) {
      alert(`Deletion Failed: ${error.message}`);
      setUserToDelete(null);
    }
  };

  if (!mounted || loading) return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-zinc-500">Authenticating clearance...</div>;

  const totalTokens = profiles.reduce((sum, p) => sum + p.tokens, 0);
  const MODAL_MONTHLY_LIMIT = 3000;
  const computePercentage = Math.min((monthlyCompute / MODAL_MONTHLY_LIMIT) * 100, 100);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8 border-b border-zinc-800 pb-8">
        <div className="h-12 w-12 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500 shadow-sm">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-zinc-50 tracking-tight">Command Center</h1>
          <p className="text-zinc-400">System administration, telemetry, and moderation.</p>
        </div>
      </div>

      {/* GLOBAL TELEMETRY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-zinc-400 mb-2 font-medium text-sm uppercase tracking-wider">
            <Users size={16} /> Total Operators
          </div>
          <div className="text-4xl font-bold text-zinc-50 tracking-tight">{profiles.length}</div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-zinc-400 mb-2 font-medium text-sm uppercase tracking-wider">
            <Coins size={16} /> Active Economy
          </div>
          <div className="text-4xl font-bold text-zinc-50 tracking-tight">{totalTokens} <span className="text-sm font-normal text-zinc-500 tracking-normal">Tokens</span></div>
        </div>

        {/* FINOPS: The Modal System Cost Monitor */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          
          {/* Top Row: Server Actions */}
          <div className="flex items-center justify-between text-zinc-400 mb-4 font-medium text-sm uppercase tracking-wider relative z-10">
            <span className="flex items-center gap-3"><Activity size={16} /> Cloud Compute</span>
            <span className="text-xs font-bold">{monthlyCompute} / {MODAL_MONTHLY_LIMIT}</span>
          </div>
          <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 mb-6 relative z-10">
            <div 
              className={`h-full transition-all duration-1000 ${computePercentage > 90 ? 'bg-red-500' : computePercentage > 75 ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${computePercentage}%` }}
            />
          </div>

          {/* Bottom Row: Financial Spend */}
          <div className="flex items-center justify-between text-zinc-400 mb-2 font-medium text-sm uppercase tracking-wider relative z-10">
            <span className="flex items-center gap-3 text-green-500">Live API Spend</span>
            <span className="text-xs font-bold">${financialSpend.toFixed(2)} / $30.00</span>
          </div>
          <div className="relative z-10">
            <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-green-900/30">
              <div 
                className={`h-full bg-green-500 transition-all duration-1000`}
                style={{ width: `${Math.min((financialSpend / 30) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex gap-4 mb-6 border-b border-zinc-800">
        <button 
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'directory' ? 'border-green-500 text-zinc-50' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          <LayoutDashboard size={16} /> Operator Directory
        </button>
        <button 
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'ledger' ? 'border-green-500 text-zinc-50' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          <List size={16} /> Global Prompt Ledger
        </button>
      </div>

      {/* TAB 1: OPERATOR DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/50 border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="p-4 font-medium">Email / ID</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Joined</th>
                  <th className="p-4 font-medium">Tokens</th>
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
                      <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest border ${profile.role === 'admin' ? 'bg-green-950/30 border-green-900/50 text-green-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                        {profile.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-zinc-400">{new Date(profile.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      {editingId === profile.id ? (
                        <input 
                          type="number" value={editTokenValue} onChange={(e) => setEditTokenValue(Number(e.target.value))}
                          className="w-20 bg-zinc-950 border border-green-500 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none"
                        />
                      ) : (
                        <span className="font-mono text-zinc-300 bg-zinc-950 px-3 py-1.5 rounded-md border border-zinc-800">{profile.tokens}</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {editingId === profile.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleSaveTokens(profile.id)} className="p-1.5 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30"><Check size={16} /></button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700"><X size={16} /></button>
                        </div>
                      ) : userToDelete === profile.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleDeleteUser(profile.id)} className="px-3 py-1.5 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 text-xs font-bold tracking-wider">CONFIRM WIPEOUT</button>
                          <button onClick={() => setUserToDelete(null)} className="p-1.5 bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditingId(profile.id); setEditTokenValue(profile.tokens); }} className="p-1.5 text-zinc-500 hover:text-green-400"><Edit2 size={16} /></button>
                          <button onClick={() => setUserToDelete(profile.id)} disabled={profile.role === 'admin'} className="p-1.5 text-zinc-500 hover:text-red-400 disabled:opacity-30 disabled:hover:text-zinc-500"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GLOBAL PROMPT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4 animate-fade-in">
          {generations.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 bg-zinc-900/30">
              No generations found in the database.
            </div>
          ) : (
            generations.map((gen) => (
              <div key={gen.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm hover:border-zinc-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-zinc-100 text-lg mb-1">{gen.theme}</h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                      <span className="bg-zinc-950 px-2 py-1 rounded border border-zinc-800">{gen.profiles?.email || 'Unknown User'}</span>
                      <span>•</span>
                      <span>{new Date(gen.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-950 border border-zinc-800/50 rounded-lg p-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">System Lore</span>
                    <p className="text-sm text-zinc-300 leading-relaxed max-h-32 overflow-y-auto custom-scrollbar pr-2">{gen.lore}</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800/50 rounded-lg p-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block flex items-center gap-1"><Terminal size={10}/> Cloud Tags</span>
                    <p className="text-xs text-zinc-400 font-mono leading-relaxed break-words max-h-32 overflow-y-auto custom-scrollbar pr-2">{gen.optimized_prompt}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}