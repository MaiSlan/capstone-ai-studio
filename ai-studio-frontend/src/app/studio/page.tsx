'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, BookOpen, Terminal, Cpu, CheckCircle2, AlertCircle, Download, History, Trash2, Coins, ArrowRight, RefreshCcw } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface CharacterData {
  id?: string;
  timestamp?: string;
  theme: string;
  lore: string;
  optimized_prompt: string;
  images: string[];
}

export default function StudioDashboard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // The Interactive State Machine
  const [phase, setPhase] = useState<number>(1); // 1: Theme, 2: Lore Edit, 3: Tag Edit, 4: Result
  const [theme, setTheme] = useState('');
  const [lore, setLore] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  
  const [history, setHistory] = useState<CharacterData[]>([]);
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [tokens, setTokens] = useState<number | null>(null);

  const [gpuStatus, setGpuStatus] = useState<'Standby' | 'Waking' | 'Active'>('Standby');
  const gpuTimerRef = useRef<NodeJS.Timeout | null>(null);

  const API_BASE = 'https://capstone-ai-studio.onrender.com/api/v1';

  useEffect(() => {
    setMounted(true);
    const initWorkspace = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
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

  const startOver = () => {
    setPhase(1);
    setTheme('');
    setLore('');
    setOptimizedPrompt('');
    setCharacterData(null);
    setError(null);
  };

  // ==========================================
  // PHASE 1: DRAFT LORE (FREE)
  // ==========================================
  const handleDraftLore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim()) return;
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/draft-lore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
      if (!res.ok) throw new Error("Failed to generate backstory.");
      const data = await res.json();
      setLore(data.lore);
      setPhase(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PHASE 2: OPTIMIZE TAGS (FREE)
  // ==========================================
  const handleOptimizeTags = async () => {
    if (!lore.trim()) return;
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/optimize-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lore }),
      });
      if (!res.ok) throw new Error("Failed to optimize tags.");
      const data = await res.json();
      setOptimizedPrompt(data.optimized_prompt);
      setPhase(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PHASE 3: RENDER GPU (COSTS 1 TOKEN)
  // ==========================================
  const handleRenderImage = async () => {
    if (!optimizedPrompt.trim()) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    const jwtToken = session?.access_token;
    if (!jwtToken) {
      setError("Authentication required.");
      return;
    }
    
    if (tokens !== null && tokens <= 0) {
      setError("Insufficient tokens.");
      return;
    }

    setLoading(true);
    setError(null);
    
    if (gpuTimerRef.current) clearTimeout(gpuTimerRef.current);
    if (gpuStatus === 'Standby') {
      setGpuStatus('Waking');
      setTimeout(() => setGpuStatus('Active'), 15000); 
    }
    
    try {
      const res = await fetch(`${API_BASE}/render-image`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ 
          theme: theme, 
          lore: lore, 
          optimized_prompt: optimizedPrompt 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to generate asset.');
      }

      const data = await res.json();
      
      const newEntry: CharacterData = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        theme,
        lore,
        optimized_prompt: optimizedPrompt,
        images: data.images
      };
      
      setCharacterData(newEntry);
      
      const updatedHistory = [newEntry, ...history].slice(0, 15);
      setHistory(updatedHistory);
      localStorage.setItem('aiStudioHistory', JSON.stringify(updatedHistory));
      
      setPhase(4);
      
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('tokens').eq('id', user.id).single();
        if (profileData) setTokens(profileData.tokens);
      }

      setGpuStatus('Active');
      gpuTimerRef.current = setTimeout(() => { setGpuStatus('Standby'); }, 5 * 60 * 1000);

    } catch (err: any) {
      setError(err.message);
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
                    setLore(item.lore);
                    setOptimizedPrompt(item.optimized_prompt);
                    setPhase(4);
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

        {/* COLUMN 2: Controller & Editing Wizard */}
        <section className="xl:col-span-4 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl flex flex-col h-full min-h-[500px]">
            
            {/* Header: Token & GPU Status */}
            <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Director Node</h2>
              <div className="flex items-center gap-2">
                {tokens !== null && (
                  <span className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest border ${
                    tokens > 0 ? 'bg-zinc-950 border-green-900/50 text-green-500' : 'bg-red-950/30 border-red-900/50 text-red-500'
                  }`}>
                    <Coins size={12} /> {tokens} Left
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest border border-zinc-800">
                  <Cpu size={12} className={gpuStatus === 'Active' ? 'text-green-500' : gpuStatus === 'Waking' ? 'text-amber-500 animate-pulse' : 'text-zinc-600'} />
                  {gpuStatus}
                </span>
              </div>
            </div>

            {/* ERROR DISPLAY */}
            {error && (
              <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 flex gap-3 text-red-400 text-xs mb-4">
                <AlertCircle size={16} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* WIZARD CONTENT */}
            <div className="flex-1 flex flex-col">
              
              {/* PHASE 1: IDEATION */}
              {phase === 1 && (
                <form onSubmit={handleDraftLore} className="space-y-4 h-full flex flex-col justify-center">
                  <div className="text-center mb-6">
                    <div className="mx-auto h-12 w-12 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center text-green-500 mb-4">
                      <Sparkles size={20} />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-100">Initialize Concept</h3>
                    <p className="text-xs text-zinc-500 mt-1">Enter a brief theme to generate the local lore.</p>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      placeholder="e.g., Cyberpunk rogue samurai"
                      disabled={loading}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-4 text-sm focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50 text-zinc-100"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-sm py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2">
                    {loading ? 'Drafting Lore...' : 'Draft Character Lore (Free)'} <ArrowRight size={16}/>
                  </button>
                </form>
              )}

              {/* PHASE 2: LORE REVIEW */}
              {phase === 2 && (
                <div className="space-y-4 h-full flex flex-col">
                  <div className="flex items-center gap-2 text-green-500 mb-2">
                    <BookOpen size={16} /> <span className="text-sm font-semibold uppercase tracking-wider">Edit Lore</span>
                  </div>
                  <p className="text-xs text-zinc-400">Review and adjust the AI-generated backstory. This will strictly inform the final visual tags.</p>
                  <textarea
                    value={lore}
                    onChange={(e) => setLore(e.target.value)}
                    disabled={loading}
                    className="w-full flex-1 min-h-[200px] bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50 text-zinc-300 custom-scrollbar resize-none"
                  />
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setPhase(1)} disabled={loading} className="px-4 py-3 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-sm text-zinc-400 transition-colors">
                      Back
                    </button>
                    <button onClick={handleOptimizeTags} disabled={loading} className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-sm py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2">
                      {loading ? 'Optimizing...' : 'Generate Cloud Tags (Free)'} <ArrowRight size={16}/>
                    </button>
                  </div>
                </div>
              )}

              {/* PHASE 3: TAG REVIEW */}
              {phase === 3 && (
                <div className="space-y-4 h-full flex flex-col">
                  <div className="flex items-center gap-2 text-green-500 mb-2">
                    <Terminal size={16} /> <span className="text-sm font-semibold uppercase tracking-wider">Edit Tags</span>
                  </div>
                  <p className="text-xs text-zinc-400">These are the precise ComfyUI instructions. Add or remove tags to force specific visual traits.</p>
                  <textarea
                    value={optimizedPrompt}
                    onChange={(e) => setOptimizedPrompt(e.target.value)}
                    disabled={loading}
                    className="w-full flex-1 min-h-[200px] bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50 text-zinc-300 font-mono custom-scrollbar resize-none leading-relaxed"
                  />
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setPhase(2)} disabled={loading} className="px-4 py-3 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-sm text-zinc-400 transition-colors">
                      Back
                    </button>
                    <button onClick={handleRenderImage} disabled={loading || (tokens !== null && tokens <= 0)} className="flex-1 bg-green-500 hover:bg-green-600 text-zinc-950 font-bold text-sm py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {loading ? 'Initializing GPU...' : 'Render Image (1 Token)'} <Cpu size={16}/>
                    </button>
                  </div>
                </div>
              )}

              {/* PHASE 4: RESULT ACTIONS */}
              {phase === 4 && (
                <div className="space-y-6 h-full flex flex-col">
                  {characterData?.images && characterData.images.length > 0 ? (
                    <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
                      {/* Success Header */}
                      <div className="flex items-center gap-4 bg-green-950/20 border border-green-900/50 rounded-lg p-4 shrink-0">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500 shrink-0">
                          <CheckCircle2 size={20} />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-bold text-green-500">Asset Rendered Successfully</h3>
                          <p className="text-xs text-zinc-400 mt-0.5">Execution complete. Saved to local history.</p>
                        </div>
                      </div>

                      {/* Read-Only Final Specs */}
                      <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
                        {/* Initial Concept */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Initial Concept</span>
                          <div className="text-sm text-zinc-200 font-medium bg-zinc-950 border border-zinc-800/50 rounded-lg p-3 shadow-inner">
                            {theme}
                          </div>
                        </div>

                        {/* System Lore */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block flex items-center gap-1.5">
                            <BookOpen size={12}/> System Lore
                          </span>
                          <div className="text-xs text-zinc-400 leading-relaxed bg-zinc-950 border border-zinc-800/50 rounded-lg p-3 shadow-inner">
                            {lore}
                          </div>
                        </div>

                        {/* Cloud Tags */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block flex items-center gap-1.5">
                            <Terminal size={12}/> Cloud Tags
                          </span>
                          <div className="text-xs text-zinc-500 font-mono leading-relaxed break-words bg-zinc-950 border border-zinc-800/50 rounded-lg p-3 shadow-inner">
                            {optimizedPrompt}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center text-center">
                      <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-4">
                        <AlertCircle size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-zinc-100">Render Failed</h3>
                        <p className="text-sm text-zinc-400 mt-2">The GPU encountered a critical error. Your token was not deducted.</p>
                      </div>
                    </div>
                  )}

                  {/* Restart Button */}
                  <div className="pt-2 mt-auto shrink-0 border-t border-zinc-800/50 pt-4">
                    <button onClick={startOver} className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-sm py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2">
                      <RefreshCcw size={16} /> Draft New Concept
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* COLUMN 3: Output Display */}
        <section className="xl:col-span-5">
          {characterData && phase === 4 ? (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 group shadow-lg">
                <div className="flex justify-between items-center text-xs uppercase tracking-wider text-zinc-400 font-medium px-1">
                  <span className="text-green-500 font-bold flex items-center gap-2"><ImageIcon size={14}/> Raw HD Render</span>
                  <button 
                    onClick={() => downloadImage(characterData.images[0], `${characterData.theme.replace(/\s+/g, '_')}_hd.png`)}
                    className="text-zinc-500 hover:text-green-400 transition-colors flex items-center gap-1 bg-zinc-950 px-3 py-1.5 rounded-md border border-zinc-800 hover:border-green-900/50"
                  >
                    <Download size={14} /> Export Asset
                  </button>
                </div>
                
                <div className="aspect-square w-full max-w-2xl mx-auto bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center relative shadow-inner">
                  <img src={`data:image/png;base64,${characterData.images[0]}`} alt="Raw High Res" className="w-full h-full object-contain p-2" />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center p-8 bg-zinc-900/20">
              <div className="h-12 w-12 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-600 mb-4 shadow-sm">
                <ImageIcon size={20} />
              </div>
              <h3 className="text-sm font-medium text-zinc-400 mb-1">Awaiting Render Execution</h3>
              <p className="text-xs text-zinc-600 max-w-xs leading-relaxed">
                Complete the ideation phase and optimize your cloud tags. The asset viewer will initialize once Modal returns the payload.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Custom icon import for the placeholder
function ImageIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  );
}