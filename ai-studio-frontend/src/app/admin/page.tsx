'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, Users, Coins, Edit2, Check, X, Trash2, 
  Activity, List, LayoutDashboard, Terminal, Cpu, DollarSign
} from 'lucide-react';
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
  const [dailyGroqTokens, setDailyGroqTokens] = useState<number>(0);
  
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

      // Fetch Users
      const { data: allProfiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (allProfiles) setProfiles(allProfiles);

      // Monthly Compute
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count } = await supabase.from('generations').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth);
      setMonthlyCompute(count || 0);

      // Global Ledger
      const { data: ledgerData } = await supabase.from('generations')
        .select('id, theme, lore, optimized_prompt, created_at, profiles(email)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (ledgerData) setGenerations(ledgerData as any);

      // Groq Daily Tokens
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { data: groqData } = await supabase
        .from('groq_telemetry')
        .select('total_tokens')
        .gte('created_at', startOfDay.toISOString());
      
      const tokensBurned = groqData?.reduce((sum, row) => sum + row.total_tokens, 0) || 0;
      setDailyGroqTokens(tokensBurned);

      setLoading(false);

      // FinOps Telemetry
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const billingRes = await fetch('https://capstone-ai-studio.onrender.com/api/v1/admin/billing', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          
          if (billingRes.ok) {
            const parsedData = await billingRes.json();
            let totalSpend = 0;
            if (parsedData.data && Array.isArray(parsedData.data)) {
              const aiStudioUsage = parsedData.data.filter((item: any) => item.Environment === 'AI_Studio');
              totalSpend = aiStudioUsage.reduce((sum: number, item: any) => {
                const itemCost = item.Cost || item.cost || 0;
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
    if (!error) {
      setProfiles(profiles.map(p => p.id === userId ? { ...p, tokens: editTokenValue } : p));
    }
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

  if (!mounted || loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center text-zinc-500">
        Authenticating clearance...
      </div>
    );
  }

  // Derived Metrics
  const totalTokens = profiles.reduce((sum, p) => sum + p.tokens, 0);
  const MODAL_MONTHLY_LIMIT = 3000;
  const computePercentage = Math.min((monthlyCompute / MODAL_MONTHLY_LIMIT) * 100, 100);
  
  const BUDGET_LIMIT = 30.00;
  const spendPercentage = Math.min((financialSpend / BUDGET_LIMIT) * 100, 100);
  const spendColor = spendPercentage > 90 ? 'text-red-500' : spendPercentage > 75 ? 'text-amber-500' : 'text-green-500';
  
  // Donut Chart SVG Math
  const donutRadius = 60;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutOffset = donutCircumference - (spendPercentage / 100) * donutCircumference;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#FFFAF0] dark:bg-zinc-950 transition-colors duration-700 p-6 bg-[repeating-linear-gradient(to_right,transparent,transparent_40px,rgba(251,113,133,0.03)_40px,rgba(251,113,133,0.03)_80px)] dark:bg-[linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b),linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b)] dark:bg-[length:20px_20px] dark:bg-[position:0_0,10px_10px]">
      
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-14 w-14 rounded-2xl bg-pink-100 dark:bg-purple-900/50 flex items-center justify-center text-pink-500 dark:text-purple-400 shadow-sm">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight" style={{ fontFamily: '"Fredoka", sans-serif' }}>
              Command Center
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">System administration • Telemetry • Moderation</p>
          </div>
        </div>

        {/* UNIFIED TELEMETRY DASHBOARD */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-[2.5rem] border border-pink-100 dark:border-purple-500/30 p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(168,85,247,0.05)] mb-10 transition-colors">
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-8 flex items-center gap-3 transition-colors" style={{ fontFamily: '"Fredoka", sans-serif' }}>
            <Activity className="text-pink-500 dark:text-purple-400" size={24} />
            System Telemetry & Economy
          </h2>
          
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-stretch">
            
            {/* FOCUS: The Spend Donut Chart */}
            <div className="flex flex-col items-center justify-center w-full lg:w-1/3 bg-zinc-50 dark:bg-zinc-950/50 rounded-[2rem] p-8 border border-zinc-100 dark:border-zinc-800 transition-colors">
              <div className="relative flex items-center justify-center">
                {/* SVG Donut */}
                <svg className="w-44 h-44 transform -rotate-90">
                  {/* Background Track */}
                  <circle 
                    cx="88" cy="88" r={donutRadius} 
                    stroke="currentColor" strokeWidth="14" fill="transparent" 
                    className="text-zinc-200 dark:text-zinc-800 transition-colors" 
                  />
                  {/* Progress Fill */}
                  <circle 
                    cx="88" cy="88" r={donutRadius} 
                    stroke="currentColor" strokeWidth="14" fill="transparent" 
                    strokeDasharray={donutCircumference} 
                    strokeDashoffset={donutOffset} 
                    strokeLinecap="round" 
                    className={`${spendColor} transition-all duration-1000 ease-out`} 
                  />
                </svg>
                {/* Center Percentage */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-zinc-800 dark:text-zinc-100 transition-colors tracking-tighter" style={{ fontFamily: '"Fredoka", sans-serif' }}>
                    {spendPercentage.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 text-center">
                <div className="uppercase text-xs font-bold tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Modal API Spend</div>
                <div className="text-xl font-mono text-zinc-700 dark:text-zinc-300 transition-colors font-bold">
                  ${financialSpend.toFixed(2)} <span className="text-sm text-zinc-400 font-normal">/ ${BUDGET_LIMIT.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* SIDE INFORMATION: The 3 Complimentary Gauges */}
            <div className="flex-1 w-full flex flex-col justify-between gap-4">
              
              {/* Stat 1: Active Economy */}
              <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between transition-colors">
                <div>
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                    <Coins size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Active Economy</span>
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Unspent user tokens</p>
                </div>
                <div className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tighter transition-colors">
                  {totalTokens} <span className="text-lg text-pink-500 dark:text-purple-400">Tokens</span>
                </div>
              </div>

              {/* Stat 2: Groq Tokens */}
              <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 transition-colors">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                      <Terminal size={16} />
                      <span className="text-xs font-bold uppercase tracking-widest">Groq API (Today)</span>
                    </div>
                    <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tighter transition-colors">
                      {dailyGroqTokens.toLocaleString()} <span className="text-sm font-normal text-zinc-400">/ 100k limit</span>
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ${dailyGroqTokens > 90000 ? 'bg-red-500' : dailyGroqTokens > 75000 ? 'bg-amber-500' : 'bg-pink-400 dark:bg-purple-500'}`}
                    style={{ width: `${Math.min((dailyGroqTokens / 100000) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stat 3: Internal Compute */}
              <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 transition-colors">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                      <Cpu size={16} />
                      <span className="text-xs font-bold uppercase tracking-widest">Cloud Compute (Monthly)</span>
                    </div>
                    <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tighter transition-colors">
                      {monthlyCompute} <span className="text-sm font-normal text-zinc-400">/ {MODAL_MONTHLY_LIMIT} generations</span>
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ${computePercentage > 90 ? 'bg-red-500' : computePercentage > 75 ? 'bg-amber-500' : 'bg-pink-400 dark:bg-purple-500'}`}
                    style={{ width: `${computePercentage}%` }}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-pink-100 dark:border-zinc-800 mb-8 transition-colors">
          <button 
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-8 py-4 font-bold transition-all border-b-2 ${activeTab === 'directory' 
              ? 'border-pink-500 dark:border-purple-500 text-pink-500 dark:text-purple-400' 
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
          >
            <LayoutDashboard size={18} />
            Operator Directory
          </button>
          <button 
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-8 py-4 font-bold transition-all border-b-2 ${activeTab === 'ledger' 
              ? 'border-pink-500 dark:border-purple-500 text-pink-500 dark:text-purple-400' 
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
          >
            <List size={18} />
            Global Prompt Ledger
          </button>
        </div>

        {/* DIRECTORY TAB */}
        {activeTab === 'directory' && (
          <div className="bg-white dark:bg-zinc-900/90 rounded-[2rem] border border-pink-100 dark:border-purple-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(168,85,247,0.05)] overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-pink-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 transition-colors">
                    {/* User count moved right into the header */}
                    <th className="text-left p-6 font-bold text-zinc-500 dark:text-zinc-400 text-sm uppercase tracking-widest transition-colors">
                      Operator ({profiles.length})
                    </th>
                    <th className="text-left p-6 font-bold text-zinc-500 dark:text-zinc-400 text-sm uppercase tracking-widest transition-colors">Role</th>
                    <th className="text-left p-6 font-bold text-zinc-500 dark:text-zinc-400 text-sm uppercase tracking-widest transition-colors">Joined</th>
                    <th className="text-left p-6 font-bold text-zinc-500 dark:text-zinc-400 text-sm uppercase tracking-widest transition-colors">Tokens</th>
                    <th className="text-right p-6 font-bold text-zinc-500 dark:text-zinc-400 text-sm uppercase tracking-widest transition-colors">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100 dark:divide-zinc-800 transition-colors">
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-pink-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="p-6">
                        <div className="font-bold text-zinc-800 dark:text-zinc-100 transition-colors">{profile.email}</div>
                        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-1 transition-colors">{profile.id}</div>
                      </td>
                      <td className="p-6">
                        <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${profile.role === 'admin' 
                          ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400' 
                          : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                          {profile.role}
                        </span>
                      </td>
                      <td className="p-6 text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-6">
                        {editingId === profile.id ? (
                          <input 
                            type="number" 
                            value={editTokenValue} 
                            onChange={(e) => setEditTokenValue(Number(e.target.value))}
                            className="w-24 bg-white dark:bg-zinc-950 border-2 border-pink-300 dark:border-purple-500 rounded-2xl px-4 py-2 text-lg font-mono focus:outline-none transition-colors"
                          />
                        ) : (
                          <span className="font-mono text-xl font-bold text-pink-500 dark:text-purple-400 transition-colors">{profile.tokens}</span>
                        )}
                      </td>
                      <td className="p-6 text-right">
                        {editingId === profile.id ? (
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => handleSaveTokens(profile.id)} className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                              <Check size={20} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                              <X size={20} />
                            </button>
                          </div>
                        ) : userToDelete === profile.id ? (
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => handleDeleteUser(profile.id)} className="px-6 py-3 bg-red-500 text-white font-bold text-sm rounded-2xl hover:bg-red-600 transition-colors">
                              CONFIRM DELETE
                            </button>
                            <button onClick={() => setUserToDelete(null)} className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                              <X size={20} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-3">
                            <button 
                              onClick={() => { setEditingId(profile.id); setEditTokenValue(profile.tokens); }} 
                              className="p-3 text-zinc-400 hover:text-pink-500 dark:hover:text-purple-400 transition-colors"
                            >
                              <Edit2 size={20} />
                            </button>
                            <button 
                              onClick={() => setUserToDelete(profile.id)} 
                              disabled={profile.role === 'admin'}
                              className="p-3 text-zinc-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                            >
                              <Trash2 size={20} />
                            </button>
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

        {/* LEDGER TAB */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            {generations.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900/90 rounded-[2rem] border border-pink-100 dark:border-purple-500/30 p-16 text-center text-zinc-500 transition-colors">
                No generations recorded yet.
              </div>
            ) : (
              generations.map((gen) => (
                <div key={gen.id} className="bg-white dark:bg-zinc-900/90 rounded-[2rem] border border-pink-100 dark:border-purple-500/30 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(168,85,247,0.05)] transition-colors">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-2 transition-colors" style={{ fontFamily: '"Fredoka", sans-serif' }}>
                        {gen.theme}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 transition-colors">
                        <span className="bg-pink-50 dark:bg-purple-900/30 px-3 py-1 rounded-full font-mono text-xs text-pink-600 dark:text-purple-300 transition-colors">{gen.profiles?.email}</span>
                        <span>•</span>
                        <span className="font-medium">{new Date(gen.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 transition-colors">
                      <div className="uppercase text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 mb-3 transition-colors">System Lore</div>
                      <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed max-h-48 overflow-y-auto custom-scrollbar transition-colors pr-2">{gen.lore}</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 transition-colors">
                      <div className="uppercase text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-2 transition-colors">
                        <Terminal size={14} /> Optimized Prompt
                      </div>
                      <p className="text-xs font-mono text-pink-600 dark:text-purple-300 leading-relaxed max-h-48 overflow-y-auto break-words custom-scrollbar transition-colors pr-2">
                        {gen.optimized_prompt}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}