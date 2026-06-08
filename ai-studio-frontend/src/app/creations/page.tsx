'use client';

import React, { useEffect, useState } from 'react';
import { BookHeart, Sparkles, Download, Trash2, X, Eraser, Loader2, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface CharacterData {
  id: string;
  theme: string;
  lore: string;
  optimized_prompt: string;
  images: string[];
  timestamp?: string;
}

// Helper function to extract a clean name from the lore or theme
const getCharacterName = (lore: string, theme: string) => {
  const match = lore.match(/(?:Name|Character):\s*\*?\*?([^\n*]+)/i);
  if (match) return match[1].trim();
  const firstLine = lore.split('\n')[0].replace(/[\*#]/g, '').trim();
  if (firstLine && firstLine.length < 40) return firstLine;
  return theme; // fallback
};

export default function MyCreations() {
  const router = useRouter();
  const supabase = createClient();

  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [history, setHistory] = useState<CharacterData[]>([]);
  const [selectedCreation, setSelectedCreation] = useState<CharacterData | null>(null);
  
  // New States for UI features
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [removingBgId, setRemovingBgId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setIsAuthenticating(false);

      const savedHistory = localStorage.getItem('aiStudioHistory');
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    };
    checkAuthAndLoadData();
  }, [router, supabase]);

  const sortedHistory = [...history].sort((a, b) => {
    // We assume the array is natively ordered newest-first by localStorage insertion.
    return sortOrder === 'newest' ? 0 : -1;
  });

  const handleDownload = (e: React.MouseEvent, base64String: string, id: string) => {
    e.stopPropagation(); 
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${base64String}`;
    a.download = `flufforia-asset-${id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    if (!window.confirm("Are you sure you want to delete this asset from your local gallery?")) return;
    
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('aiStudioHistory', JSON.stringify(newHistory));
    if (selectedCreation?.id === id) setSelectedCreation(null);
  };

  // The inline Background Remover logic for the Modal
  const handleInlineBgRemove = async (creationId: string, currentBase64: string) => {
    setRemovingBgId(creationId);
    try {
      const resBase64 = await fetch(`data:image/png;base64,${currentBase64}`);
      const blob = await resBase64.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'character.png');

      const res = await fetch('/api/tools/bg-remove', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to remove background.");
      }

      const resultBlob = await res.blob();
      const reader = new FileReader();
      reader.readAsDataURL(resultBlob);
      reader.onloadend = () => {
        const base64data = (reader.result as string).split(',')[1];
        
        // Update History
        const updatedHistory = history.map(item => 
          item.id === creationId ? { ...item, images: [base64data] } : item
        );
        setHistory(updatedHistory);
        localStorage.setItem('aiStudioHistory', JSON.stringify(updatedHistory));
        
        // Update Modal view live
        if (selectedCreation && selectedCreation.id === creationId) {
          setSelectedCreation({ ...selectedCreation, images: [base64data] });
        }
      };
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRemovingBgId(null);
    }
  };

  const checkerboardBg = {
    backgroundImage: `
      linear-gradient(45deg, rgba(128,128,128,0.1) 25%, transparent 25%), 
      linear-gradient(-45deg, rgba(128,128,128,0.1) 25%, transparent 25%), 
      linear-gradient(45deg, transparent 75%, rgba(128,128,128,0.1) 75%), 
      linear-gradient(-45deg, transparent 75%, rgba(128,128,128,0.1) 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
  };

  if (isAuthenticating) {
    return <div className="min-h-screen bg-[#FFFAF0] dark:bg-zinc-950 transition-colors duration-700"></div>;
  }

  return (
    <div className="min-h-screen bg-[#FFFAF0] dark:bg-zinc-950 pt-32 pb-20 px-6 transition-colors duration-700 bg-[repeating-linear-gradient(to_right,transparent,transparent_40px,rgba(251,113,133,0.03)_40px,rgba(251,113,133,0.03)_80px)] dark:bg-[linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b),linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b)] dark:bg-[length:20px_20px] dark:bg-[position:0_0,10px_10px]">
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-10 animate-fade-in">
          <div className="mx-auto h-16 w-16 rounded-full bg-pink-100 dark:bg-purple-900/50 text-pink-500 dark:text-purple-400 flex items-center justify-center mb-4 shadow-sm transform -rotate-3 transition-colors">
            <BookHeart size={32} />
          </div>
          <h1 className="text-4xl font-bold text-zinc-800 dark:text-zinc-100 mb-4 transition-colors" style={{ fontFamily: '"Fredoka", sans-serif' }}>My Creations</h1>
          <p className="text-zinc-500 dark:text-zinc-400 transition-colors">Your personal gallery of generated characters and assets.</p>
        </div>

        {/* Filter Toggle */}
        {history.length > 0 && (
          <div className="flex justify-end mb-6">
            <button 
              onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-pink-100 dark:border-zinc-800 rounded-full text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-pink-500 dark:hover:text-purple-400 shadow-sm transition-colors"
            >
              <ArrowUpDown size={14} />
              {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>
        )}

        {history.length === 0 ? (
          <div className="text-center bg-white dark:bg-zinc-900/90 border border-pink-100 dark:border-purple-500/30 rounded-3xl p-16 shadow-sm transition-colors">
            <Sparkles size={48} className="mx-auto text-pink-200 dark:text-purple-900/50 mb-4 transition-colors" />
            <h3 className="text-xl font-bold text-zinc-700 dark:text-zinc-200 mb-2 transition-colors">No creations yet!</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6 transition-colors">Head over to the Studio to bring your first character to life.</p>
            <Link href="/studio" className="inline-flex bg-pink-400 dark:bg-purple-600 hover:bg-pink-500 dark:hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full transition-all shadow-[0_4px_0_rgba(244,114,182,0.4)] dark:shadow-[0_4px_0_rgba(147,51,234,0.4)] hover:translate-y-[2px]">
              Enter Studio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedHistory.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedCreation(item)}
                className="bg-white dark:bg-zinc-900/90 border border-pink-100 dark:border-purple-500/30 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(168,85,247,0.05)] hover:shadow-[0_8px_30px_rgb(251,113,133,0.1)] dark:hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all group cursor-pointer flex flex-col"
              >
                <div className="aspect-square bg-zinc-50 dark:bg-zinc-950 relative border-b border-pink-50 dark:border-zinc-800 overflow-hidden transition-colors" style={checkerboardBg}>
                  <img 
                    src={`data:image/png;base64,${item.images[0]}`} 
                    alt={item.theme} 
                    className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleDownload(e, item.images[0], item.id)} className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur text-pink-500 dark:text-purple-400 p-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors" title="Download Image">
                      <Download size={18} />
                    </button>
                    <button onClick={(e) => handleDelete(e, item.id)} className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur text-red-400 p-2 rounded-full shadow-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete Asset">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-6 transition-colors flex-1 flex flex-col">
                  {/* Replaced Theme with Character Name */}
                  <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 line-clamp-1 mb-2 transition-colors" style={{ fontFamily: '"Fredoka", sans-serif' }}>
                    {getCharacterName(item.lore, item.theme)}
                  </h3>
                  
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed mb-4 flex-1 transition-colors">
                    {item.lore}
                  </p>
                  <p className="text-[10px] font-bold text-pink-400 dark:text-purple-400 uppercase tracking-widest group-hover:text-pink-500 dark:group-hover:text-purple-300 transition-colors">
                    Click to view details &rarr;
                  </p>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* REWORKED MODAL OVERLAY */}
      {selectedCreation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCreation(null)}></div>
          
          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-3xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-pink-100 dark:border-purple-500/30 transition-colors">
            
            {/* Header Area */}
            <div className="flex items-start justify-between p-6 border-b border-pink-50 dark:border-zinc-800 transition-colors">
              <div>
                <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 transition-colors" style={{ fontFamily: '"Fredoka", sans-serif' }}>
                  {getCharacterName(selectedCreation.lore, selectedCreation.theme)}
                </h2>
                {/* Replaced ID with Initial Concept */}
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">Concept: {selectedCreation.theme}</p>
              </div>
              <button onClick={() => setSelectedCreation(null)} className="h-10 w-10 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body Area - Centered Design */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col items-center custom-scrollbar">
              
              {/* Centered Large Image */}
              <div className="w-full max-w-lg aspect-square bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-pink-100 dark:border-zinc-800 overflow-hidden shadow-inner transition-colors mb-6 relative" style={checkerboardBg}>
                <img 
                  src={`data:image/png;base64,${selectedCreation.images[0]}`} 
                  alt="Asset Preview" 
                  className={`w-full h-full object-contain p-2 transition-opacity duration-300 ${removingBgId === selectedCreation.id ? 'opacity-30 blur-sm' : 'opacity-100'}`}
                />
              </div>

              {/* Action Buttons under Image */}
              <div className="flex flex-wrap items-center justify-center gap-4 w-full max-w-lg mb-10">
                <button 
                  onClick={(e) => handleDownload(e, selectedCreation.images[0], selectedCreation.id)}
                  className="flex-1 bg-pink-50 dark:bg-purple-900/20 hover:bg-pink-100 dark:hover:bg-purple-900/40 text-pink-600 dark:text-purple-400 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Download High-Res
                </button>
                <button 
                  onClick={() => handleInlineBgRemove(selectedCreation.id, selectedCreation.images[0])}
                  disabled={removingBgId === selectedCreation.id}
                  className="flex-1 bg-pink-400 dark:bg-purple-600 hover:bg-pink-500 dark:hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-[0_2px_0_rgba(244,114,182,0.4)] dark:shadow-[0_2px_0_rgba(147,51,234,0.4)] hover:translate-y-[1px] flex items-center justify-center gap-2"
                >
                  {removingBgId === selectedCreation.id ? <Loader2 size={18} className="animate-spin" /> : <Eraser size={18} />}
                  {removingBgId === selectedCreation.id ? 'Processing...' : 'Remove Background'}
                </button>
              </div>

              {/* Backstory below buttons */}
              <div className="w-full text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 transition-colors mb-2 block">System Lore & Appearance</span>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-xl p-6 shadow-inner leading-relaxed whitespace-pre-wrap transition-colors">
                  {selectedCreation.lore}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}