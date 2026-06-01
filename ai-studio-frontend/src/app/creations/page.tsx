'use client';

import React, { useEffect, useState } from 'react';
import { BookHeart, Sparkles, Download, Clock, Trash2, X, Copy, Check } from 'lucide-react';
import Link from 'next/link';

interface CharacterData {
  id: string;
  theme: string;
  lore: string;
  optimized_prompt: string;
  images: string[];
  timestamp?: string;
}

export default function MyCreations() {
  const [history, setHistory] = useState<CharacterData[]>([]);
  const [selectedCreation, setSelectedCreation] = useState<CharacterData | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('aiStudioHistory');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const handleDownload = (e: React.MouseEvent, base64String: string, id: string) => {
    e.stopPropagation(); // Prevents opening the modal when clicking download
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${base64String}`;
    a.download = `flufforia-asset-${id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevents opening the modal
    if (!window.confirm("Are you sure you want to delete this asset from your local gallery?")) return;
    
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('aiStudioHistory', JSON.stringify(newHistory));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FFFAF0] pt-32 pb-20 px-6 bg-[repeating-linear-gradient(to_right,transparent,transparent_40px,rgba(251,113,133,0.03)_40px,rgba(251,113,133,0.03)_80px)]">
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16 animate-fade-in">
          <div className="mx-auto h-16 w-16 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center mb-4 shadow-sm transform -rotate-3">
            <BookHeart size={32} />
          </div>
          <h1 className="text-4xl font-bold text-zinc-800 mb-4" style={{ fontFamily: '"Fredoka", sans-serif' }}>My Creations</h1>
          <p className="text-zinc-500">Your personal gallery of generated characters and assets.</p>
        </div>

        {history.length === 0 ? (
          <div className="text-center bg-white border border-pink-100 rounded-3xl p-16 shadow-sm">
            <Sparkles size={48} className="mx-auto text-pink-200 mb-4" />
            <h3 className="text-xl font-bold text-zinc-700 mb-2">No creations yet!</h3>
            <p className="text-zinc-500 mb-6">Head over to the Studio to bring your first character to life.</p>
            <Link href="/studio" className="inline-flex bg-pink-400 hover:bg-pink-500 text-white font-bold py-3 px-8 rounded-full transition-all shadow-[0_4px_0_rgba(244,114,182,0.4)] hover:translate-y-[2px]">
              Enter Studio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {history.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedCreation(item)}
                className="bg-white border border-pink-100 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(251,113,133,0.1)] transition-all group cursor-pointer"
              >
                
                <div className="aspect-square bg-zinc-50 relative border-b border-pink-50 overflow-hidden">
                  <img 
                    src={`data:image/png;base64,${item.images[0]}`} 
                    alt={item.theme} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Action Buttons Overlay */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleDownload(e, item.images[0], item.id)}
                      className="bg-white/90 backdrop-blur text-pink-500 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                      title="Download Image"
                    >
                      <Download size={18} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, item.id)}
                      className="bg-white/90 backdrop-blur text-red-400 p-2 rounded-full shadow-lg hover:bg-red-50 transition-colors"
                      title="Delete Asset"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-zinc-800 line-clamp-1" style={{ fontFamily: '"Fredoka", sans-serif' }}>
                      {item.theme}
                    </h3>
                    {item.timestamp && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-50 px-2 py-1 rounded-full shrink-0">
                        <Clock size={10} /> {item.timestamp}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed mb-4">
                    {item.lore}
                  </p>
                  <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest group-hover:text-pink-500">
                    Click to view details &rarr;
                  </p>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL OVERLAY */}
      {selectedCreation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            onClick={() => setSelectedCreation(null)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-pink-100">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-pink-50">
              <div>
                <h2 className="text-2xl font-bold text-zinc-800" style={{ fontFamily: '"Fredoka", sans-serif' }}>
                  Asset Details
                </h2>
                <p className="text-xs text-zinc-400 mt-1">ID: {selectedCreation.id}</p>
              </div>
              <button 
                onClick={() => setSelectedCreation(null)}
                className="h-10 w-10 bg-zinc-50 text-zinc-500 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 custom-scrollbar">
              
              {/* Left Col: Image */}
              <div className="space-y-4">
                <div className="w-full aspect-square bg-zinc-50 rounded-2xl border border-pink-100 overflow-hidden shadow-inner">
                  <img 
                    src={`data:image/png;base64,${selectedCreation.images[0]}`} 
                    alt={selectedCreation.theme} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button 
                  onClick={(e) => handleDownload(e, selectedCreation.images[0], selectedCreation.id)}
                  className="w-full bg-pink-50 hover:bg-pink-100 text-pink-600 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Download High-Res Image
                </button>
              </div>

              {/* Right Col: Documentation */}
              <div className="space-y-6">
                
                {/* Concept Block */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Initial Concept</span>
                    <button onClick={() => handleCopy(selectedCreation.theme, 'theme')} className="text-pink-400 hover:text-pink-600 transition-colors">
                      {copiedKey === 'theme' ? <Check size={14}/> : <Copy size={14}/>}
                    </button>
                  </div>
                  <div className="text-sm text-zinc-700 bg-zinc-50 border border-zinc-100 rounded-xl p-4 shadow-inner">
                    {selectedCreation.theme}
                  </div>
                </div>

                {/* Lore Block */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">System Lore & Appearance</span>
                    <button onClick={() => handleCopy(selectedCreation.lore, 'lore')} className="text-pink-400 hover:text-pink-600 transition-colors">
                      {copiedKey === 'lore' ? <Check size={14}/> : <Copy size={14}/>}
                    </button>
                  </div>
                  <div className="text-sm text-zinc-600 bg-zinc-50 border border-zinc-100 rounded-xl p-4 shadow-inner leading-relaxed whitespace-pre-wrap">
                    {selectedCreation.lore}
                  </div>
                </div>

                {/* Tags Block */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Cloud Tags (ComfyUI)</span>
                    <button onClick={() => handleCopy(selectedCreation.optimized_prompt, 'tags')} className="text-pink-400 hover:text-pink-600 transition-colors">
                      {copiedKey === 'tags' ? <Check size={14}/> : <Copy size={14}/>}
                    </button>
                  </div>
                  <div className="text-xs text-pink-500 font-mono bg-pink-50/50 border border-pink-100 rounded-xl p-4 shadow-inner leading-relaxed break-words">
                    {selectedCreation.optimized_prompt}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}