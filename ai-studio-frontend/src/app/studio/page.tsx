'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, BookOpen, Terminal, Cpu, CheckCircle2, AlertCircle, Download, History, Trash2, Coins } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface CharacterData {
  id?: string;
  timestamp?: string;
  status: string;
  theme: string;
  lore: string;
  optimized_prompt: string;
  images: string[];
}

export default function StudioDashboard() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [history, setHistory] = useState<CharacterData[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Auth & Economy State
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [tokens, setTokens] = useState<number | null>(null);

  // GPU Lifecycle State
  const [gpuStatus, setGpuStatus] = useState<'Standby' | 'Waking' | 'Active'>('Standby');
  const gpuTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Initialize User, Tokens, and History
    const initWorkspace = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Fetch current token balance
        const { data } = await supabase.from('profiles').select('tokens').eq('id', user.id).single();
        if (data) setTokens(data.tokens);
      }

      const savedHistory = localStorage.getItem('aiStudioHistory');
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    };
    
    initWorkspace();
  }, []);

  const downloadImage = (base64String: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64String}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearHistory = () => {
    localStorage.removeItem('aiStudioHistory');
    setHistory([]);
  };

  const triggerPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim()) return;

    setLoading(true);
    setError(null);
    setCharacterData(null);
    setPipelineStep(0);
    
    // 1. Grab the user's active session token (The VIP Pass)
    const { data: { session } } = await supabase.auth.getSession();
    const jwtToken = session?.access_token;

    if (!jwtToken) {
      setError("Authentication required. Please sign in.");
      setLoading(false);
      return;
    }
    
    if (gpuTimerRef.current) clearTimeout(gpuTimerRef.current);
    if (gpuStatus === 'Standby') {
      setGpuStatus('Waking');
      setTimeout(() => setGpuStatus('Active'), 15000); 
    }

    setTimeout(() => setPipelineStep(1), 500);  
    setTimeout(() => setPipelineStep(2), 3500); 
    setTimeout(() => setPipelineStep(3), 6000); 
    
    try {
      const response = await fetch('https://capstone-ai-studio.onrender.com/api/v1/generate-character', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}` // <--- Injecting the token securely!
        },
        body: JSON.stringify({ theme }),
      });

      // Catch backend security rejections (401 Unauthorized, 402 Insufficient Tokens)
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate assets from cloud pipeline.');
      }

      const data = await response.json();
      const newEntry: CharacterData = {
        ...data,
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setCharacterData(newEntry);
      
      const updatedHistory = [newEntry, ...history].slice(0, 15);
      setHistory(updatedHistory);
      localStorage.setItem('aiStudioHistory', JSON.stringify(updatedHistory));
      
      setPipelineStep(4);
      
      // 2. Fetch the true token balance directly from the server (NO MORE CLIENT DEDUCTION)
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('tokens').eq('id', user.id).single();
        if (profileData) setTokens(profileData.tokens);
      }

      setGpuStatus('Active');
      gpuTimerRef.current = setTimeout(() => {
        setGpuStatus('Standby');
      }, 5 * 60 * 1000);

    } catch (err: any) {
      setError(err.message || 'An unexpected orchestration error occurred.');
      setPipelineStep(0);
      setGpuStatus('Standby');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-50 font-sans antialiased">
      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* COLUMN 1: History Sidebar */}
        <section className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-zinc-400">
            <h2 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <History size={14} /> Workspace History
            </h2>
            {history.length > 0 && (
              <button onClick={clearHistory} className="hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-150px)] pr-2">
            {history.length === 0 ? (
              <p className="text-xs text-zinc-600 border border-dashed border-zinc-800 p-4 rounded-lg text-center">No past generations found.</p>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => {
                    setCharacterData(item);
                    setTheme(item.theme);
                    setPipelineStep(4);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${characterData?.id === item.id ? 'bg-zinc-800/80 border-zinc-700' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-zinc-300 line-clamp-1">{item.theme}</span>
                    <span className="text-[10px] text-zinc-500">{item.timestamp}</span>
                  </div>
                  <div className="flex gap-2 h-12">
                    {item.images.slice(0,1).map((img, idx) => (
                      <div key={idx} className="h-full aspect-square bg-zinc-950 rounded border border-zinc-800 overflow-hidden">
                         <img src={`data:image/png;base64,${img}`} className="w-full h-full object-cover opacity-80" alt="thumbnail" />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* COLUMN 2: Pipeline Controls */}
        <section className="xl:col-span-3 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
            
            {/* Header: Token & GPU Status */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Controller</h2>
              <div className="flex items-center gap-2">
                
                {/* Token Badge */}
                {tokens !== null && (
                  <span className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest border ${
                    tokens > 0 ? 'bg-zinc-950 border-green-900/50 text-green-500' : 'bg-red-950/30 border-red-900/50 text-red-500'
                  }`}>
                    <Coins size={12} />
                    {tokens} Left
                  </span>
                )}

                {/* GPU Badge */}
                <span className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest border border-zinc-800">
                  <Cpu size={12} className={
                    gpuStatus === 'Active' ? 'text-green-500' :
                    gpuStatus === 'Waking' ? 'text-amber-500 animate-pulse' :
                    'text-zinc-600'
                  } />
                  {gpuStatus}
                </span>
              </div>
            </div>

            <form onSubmit={triggerPipeline} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Concept Theme</label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g., neon samurai fox girl"
                  disabled={loading || (tokens !== null && tokens <= 0)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50 text-zinc-100 placeholder:text-zinc-700"
                />
              </div>
              <button
                type="submit"
                disabled={loading || (tokens !== null && tokens <= 0)}
                className="w-full bg-green-500 hover:bg-green-600 text-zinc-950 font-bold text-sm py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-green-500"
              >
                <Sparkles size={16} />
                {loading ? 'Processing Pipeline...' : 'Initialize Engine (1 Token)'}
              </button>
            </form>
          </div>

          {(pipelineStep > 0 || loading) && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Orchestration Steps</h3>
              <div className="space-y-3">
                <PipelineStep icon={<BookOpen size={16} />} label="Local Lore Generation" isActive={pipelineStep === 1} isDone={pipelineStep > 1} />
                <PipelineStep icon={<Terminal size={16} />} label="Cloud Tag Optimization" isActive={pipelineStep === 2} isDone={pipelineStep > 2} />
                <PipelineStep icon={<Cpu size={16} />} label="Modal Cloud GPU Rendering" isActive={pipelineStep === 3} isDone={pipelineStep > 3} />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 flex gap-3 text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </section>

        {/* COLUMN 3: Output Display */}
        <section className="xl:col-span-6">
          {characterData ? (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 group shadow-lg">
                <div className="flex justify-between items-center text-xs uppercase tracking-wider text-zinc-400 font-medium px-1">
                  <span className="text-green-500 font-bold">Raw HD Render</span>
                  <button 
                    onClick={() => downloadImage(characterData.images[0], `${characterData.theme.replace(/\s+/g, '_')}_hd.png`)}
                    className="text-zinc-500 hover:text-green-400 transition-colors flex items-center gap-1 bg-zinc-950 px-3 py-1.5 rounded-md border border-zinc-800"
                  >
                    <Download size={14} /> Export Asset
                  </button>
                </div>
                
                <div className="aspect-square w-full max-w-2xl mx-auto bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center relative shadow-inner">
                  <img src={`data:image/png;base64,${characterData.images[0]}`} alt="Raw High Res" className="w-full h-full object-contain p-2" />
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6 shadow-lg">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                    <BookOpen size={14} className="text-green-500"/> Character Backstory
                  </h3>
                  <div className="text-sm text-zinc-300 leading-relaxed max-h-48 overflow-y-auto pr-2 whitespace-pre-wrap custom-scrollbar">
                    {characterData.lore}
                  </div>
                </div>
                <hr className="border-zinc-800" />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Terminal size={14} className="text-green-500"/> Cloud Prompts
                  </h3>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-500 break-words select-all">
                    {characterData.optimized_prompt}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center p-8 bg-zinc-900/20">
              <div className="h-12 w-12 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-green-500 mb-4 shadow-sm">
                <Terminal size={20} />
              </div>
              <h3 className="text-sm font-medium text-zinc-300 mb-1">Workspace Ready</h3>
              <p className="text-xs text-zinc-500 max-w-xs">Enter a theme to generate an asset. 1 Token will be deducted upon generation.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function PipelineStep({ icon, label, isActive, isDone }: { icon: React.ReactNode; label: string; isActive: boolean; isDone: boolean }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all duration-300 ${
      isActive ? 'bg-zinc-800/50 border-zinc-700 text-zinc-100 font-medium' : 
      isDone ? 'bg-zinc-900/30 border-zinc-800/40 text-zinc-500' : 'bg-zinc-950/20 border-transparent text-zinc-700'
    }`}>
      <div className="flex items-center gap-3">
        <div className={isActive ? 'text-zinc-100' : isDone ? 'text-zinc-500' : 'text-zinc-700'}>{icon}</div>
        <span>{label}</span>
      </div>
      {isDone && <CheckCircle2 size={16} className="text-zinc-400" />}
      {isActive && <div className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-pulse" />}
    </div>
  );
}