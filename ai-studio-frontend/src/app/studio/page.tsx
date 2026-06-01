'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Wand2, Download, ExternalLink, Loader2, ArrowRight, CheckCircle2, AlertCircle, BookOpen, Terminal, Cpu } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

const API_BASE = 'https://capstone-ai-studio.onrender.com/api/v1';

interface CharacterData {
  id: string;
  theme: string;
  lore: string;
  optimized_prompt: string;
  images: string[];
  timestamp?: string;
}

export default function FlufforiaStudio() {
  const router = useRouter();
  const supabase = createClient();

  // Authentication & Economy States
  const [user, setUser] = useState<any>(null);
  const [tokens, setTokens] = useState<number | null>(null);

  // Pipeline States
  const [phase, setPhase] = useState<number>(1);
  const [theme, setTheme] = useState('');
  const [lore, setLore] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [history, setHistory] = useState<CharacterData[]>([]);
  const [appearancePart, setAppearancePart] = useState('');
  const [backstoryPart, setBackstoryPart] = useState('');
  
  // System States
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [gpuStatus, setGpuStatus] = useState<'Standby' | 'Waking' | 'Active'>('Standby');
  const gpuTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auth Check on Mount
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setUser(session.user);
      const { data: profile } = await supabase.from('profiles').select('tokens').eq('id', session.user.id).single();
      if (profile) setTokens(profile.tokens);

      const savedHistory = localStorage.getItem('aiStudioHistory');
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    };
    init();
  }, [router, supabase]);

  // ==========================================
  // PIPELINE FUNCTIONS 
  // ==========================================
  
  const handleDraftLore = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!theme.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/draft-lore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
      if (!res.ok) throw new Error('Failed to generate backstory.');
      const data = await res.json();
      
      setLore(data.lore); // Keep the master string safe
      
      // Split the text visually for the user
      const parts = data.lore.split('\n\n');
      setAppearancePart(parts[0] || '');
      setBackstoryPart(parts.slice(1).join('\n\n') || '');
      
      setPhase(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeTags = async () => {
    if (!lore.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/optimize-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lore: `${appearancePart}\n\n${backstoryPart}` }),
      });
      if (!res.ok) throw new Error('Failed to optimize tags.');
      const data = await res.json();
      setOptimizedPrompt(data.optimized_prompt);
      setPhase(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    }
    
    try {
      const res = await fetch(`${API_BASE}/render-image`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ theme, lore, optimized_prompt: optimizedPrompt }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to queue rendering pipeline.');
      }

      const queueData = await res.json();
      const jobId = queueData.generation_id;

      setLoadingMessage("Warming serverless neural engine... (Cold starts take ~60s)");
      
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_BASE}/render-status/${jobId}`, {
            headers: { 'Authorization': `Bearer ${jwtToken}` }
          });
          
          if (!statusRes.ok) return; 
          const job = await statusRes.json();

          if (job.status === 'completed') {
            clearInterval(pollInterval);
            
            const newEntry: CharacterData = {
              id: jobId,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              theme,
              lore,
              optimized_prompt: optimizedPrompt,
              images: [job.image_base64] 
            };
            
            setCharacterData(newEntry);
            
            // Persist to history for the future /creations page
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
            
            setLoading(false);
            
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            setError("The GPU encountered a critical error. Your token was not deducted.");
            setGpuStatus('Standby');
            setLoading(false);
          } else {
            setLoadingMessage(prev => prev.includes("Warming") ? "Executing Tensor K-Sampler math..." : "Refining final details...");
          }
        } catch (pollErr) {
          console.error("Polling slipped, retrying...", pollErr);
        }
      }, 3000);

    } catch (err: any) {
      setError(err.message || "Pipeline orchestration severed.");
      setGpuStatus('Standby');
      setLoading(false); 
    }
  };

  const handleDownload = () => {
    if (!characterData?.images?.[0]) return;
    const a = document.createElement('a');
    // Ensure base64 prefix is attached for downloading
    a.href = `data:image/png;base64,${characterData.images[0]}`;
    a.download = `flufforia-asset-${characterData.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const startOver = () => {
    setTheme('');
    setLore('');
    setOptimizedPrompt('');
    setCharacterData(null);
    setPhase(1);
    setError(null);
  };

  // ==========================================
  // UI RENDER
  // ==========================================
  
  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#FFFAF0] flex flex-col items-center justify-center p-6 bg-[repeating-linear-gradient(to_right,transparent,transparent_40px,rgba(251,113,133,0.03)_40px,rgba(251,113,133,0.03)_80px)]">
      
      {/* THE MORPHING CARD */}
      <div className={`
        bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-pink-100 overflow-hidden relative transition-all duration-700 ease-in-out
        ${phase === 1 ? 'max-w-xl w-full' : phase === 4 ? 'max-w-3xl w-full' : 'max-w-2xl w-full'}
      `}>
        
        {/* INNER GPU STATUS PILL */}
        <div className="absolute top-6 right-6 z-10 hidden sm:block">
           <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-zinc-50 border border-zinc-100 text-zinc-500 shadow-sm">
            <Cpu size={12} className={gpuStatus === 'Active' ? 'text-green-500' : gpuStatus === 'Waking' ? 'text-amber-500 animate-pulse' : 'text-zinc-300'} />
            GPU: {gpuStatus}
          </span>
        </div>

        {/* PROGRESS BAR */}
        {phase < 4 && (
          <div className="h-1.5 w-full bg-pink-50">
            <div 
              className="h-full bg-pink-300 transition-all duration-500 ease-out"
              style={{ width: `${(phase / 4) * 100}%` }}
            />
          </div>
        )}

        <div className="p-8 md:p-10">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-500 rounded-2xl flex items-center gap-3 text-sm font-medium">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* PHASE 1: CONCEPT INPUT */}
          {phase === 1 && (
            <form onSubmit={handleDraftLore} className="flex flex-col items-center text-center space-y-6 animate-fade-in mt-4">
              <div className="h-16 w-16 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center mb-2 shadow-inner">
                <Sparkles size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-zinc-800" style={{ fontFamily: '"Fredoka", sans-serif' }}>Draft a Concept</h2>
                <p className="text-zinc-500 mt-2 text-sm">Describe the character you want to bring to life. Keep it simple!</p>
              </div>
              
              <textarea
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. A cute witch with an oversized hat..."
                className="w-full h-32 bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 text-zinc-700 focus:outline-none focus:border-pink-300 focus:bg-white transition-colors resize-none placeholder:text-zinc-400"
              />
              
              <button 
                type="submit"
                disabled={!theme.trim() || loading}
                className="w-full bg-pink-400 hover:bg-pink-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_0_rgba(244,114,182,0.4)] hover:shadow-[0_2px_0_rgba(244,114,182,0.4)] hover:translate-y-[2px]"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
                {loading ? 'Drafting Magic...' : 'Generate Lore (Free)'}
              </button>
            </form>
          )}

          {/* PHASE 2: SPLIT LORE EDITING */}
          {phase === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <h2 className="text-2xl font-bold text-zinc-800 flex items-center gap-2" style={{ fontFamily: '"Fredoka", sans-serif' }}>
                  <BookOpen size={24} className="text-pink-400"/> System Lore
                </h2>
                <span className="text-xs font-bold uppercase tracking-wider text-pink-400 bg-pink-50 px-3 py-1 rounded-full">
                  Step 2 of 3
                </span>
              </div>
              
              <p className="text-sm text-zinc-500">Review and adjust the AI-generated backstory and appearance.</p>

              <div className="space-y-4">
                {/* Visual Appearance Block */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 pl-1">Visual Appearance</label>
                  <div className="bg-zinc-50 rounded-2xl p-1 border border-zinc-100 shadow-inner">
                    <textarea
                        value={appearancePart}
                        onChange={(e) => setAppearancePart(e.target.value)}
                        disabled={loading}
                        className="w-full h-[120px] bg-transparent p-3 text-sm focus:outline-none disabled:opacity-50 text-zinc-700 custom-scrollbar resize-none"
                      />
                  </div>
                </div>

                {/* Backstory Block */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 pl-1">Character Backstory</label>
                  <div className="bg-zinc-50 rounded-2xl p-1 border border-zinc-100 shadow-inner">
                    <textarea
                        value={backstoryPart}
                        onChange={(e) => setBackstoryPart(e.target.value)}
                        disabled={loading}
                        className="w-full h-[120px] bg-transparent p-3 text-sm focus:outline-none disabled:opacity-50 text-zinc-700 custom-scrollbar resize-none"
                      />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setPhase(1)} 
                  disabled={loading}
                  className="px-6 py-4 rounded-2xl font-bold text-zinc-500 bg-zinc-100 hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button 
                  onClick={handleOptimizeTags}
                  disabled={loading}
                  className="flex-1 bg-pink-400 hover:bg-pink-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_0_rgba(244,114,182,0.4)] hover:translate-y-[2px]"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> Processing...</>
                  ) : (
                    <>Generate Tags (Free) <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PHASE 3: TAG REFINEMENT */}
          {phase === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <h2 className="text-2xl font-bold text-zinc-800 flex items-center gap-2" style={{ fontFamily: '"Fredoka", sans-serif' }}>
                  <Terminal size={24} className="text-pink-400"/> Cloud Tags
                </h2>
                <span className="text-xs font-bold uppercase tracking-wider text-pink-400 bg-pink-50 px-3 py-1 rounded-full">
                  Step 3 of 3
                </span>
              </div>
              
              <p className="text-sm text-zinc-500">These are the precise ComfyUI instructions. Adjust if needed.</p>

              <div className="bg-zinc-50 rounded-2xl p-2 border border-zinc-100 shadow-inner">
                <textarea
                    value={optimizedPrompt}
                    onChange={(e) => setOptimizedPrompt(e.target.value)}
                    disabled={loading}
                    className="w-full min-h-[200px] bg-transparent p-4 text-sm focus:outline-none disabled:opacity-50 text-zinc-700 font-mono custom-scrollbar resize-none"
                  />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setPhase(2)} 
                  disabled={loading}
                  className="px-6 py-4 rounded-2xl font-bold text-zinc-500 bg-zinc-100 hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button 
                  onClick={handleRenderImage}
                  disabled={loading || (tokens !== null && tokens <= 0)}
                  className="flex-1 bg-pink-400 hover:bg-pink-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_0_rgba(244,114,182,0.4)] hover:translate-y-[2px]"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> {loadingMessage || 'Processing...'}</>
                  ) : (
                    <>Render Asset (1 Token) <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PHASE 4: FINAL SHOWCASE */}
          {phase === 4 && characterData?.images?.[0] && (
            <div className="animate-fade-in -m-8 md:-m-10 relative group">
              
              <Link 
                href="/creations" 
                className="absolute top-6 right-6 z-10 bg-white/90 backdrop-blur hover:bg-white text-zinc-700 font-semibold px-4 py-2 rounded-full shadow-lg transition-all flex items-center gap-2 text-sm opacity-90 hover:opacity-100 transform hover:scale-105"
              >
                <ExternalLink size={16} className="text-pink-500" />
                View Details
              </Link>

              <div className="w-full aspect-square bg-zinc-50 relative border-b border-pink-100">
                <img 
                  src={`data:image/png;base64,${characterData.images[0]}`} 
                  alt="Generated Asset" 
                  className="w-full h-full object-contain p-4"
                />
              </div>

              <div className="p-6 md:p-8 bg-white flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={startOver} 
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  Draft New Concept
                </button>
                <button 
                  onClick={handleDownload} 
                  className="flex-1 bg-pink-400 hover:bg-pink-500 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-[0_4px_0_rgba(244,114,182,0.4)] hover:translate-y-[2px] flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download Asset
                </button>
              </div>
              
            </div>
          )}

        </div>
      </div>
    </div>
  );
}