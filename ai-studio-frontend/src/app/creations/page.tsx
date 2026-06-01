'use client';

import React, { useEffect, useState } from 'react';
import { BookHeart, Sparkles, Download, Clock } from 'lucide-react';
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

  useEffect(() => {
    const savedHistory = localStorage.getItem('aiStudioHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleDownload = (base64String: string, id: string) => {
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${base64String}`;
    a.download = `flufforia-asset-${id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
              <div key={item.id} className="bg-white border border-pink-100 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(251,113,133,0.1)] transition-all group">
                
                <div className="aspect-square bg-zinc-50 relative border-b border-pink-50 overflow-hidden">
                  <img 
                    src={`data:image/png;base64,${item.images[0]}`} 
                    alt={item.theme} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDownload(item.images[0], item.id)}
                      className="bg-white/90 backdrop-blur text-pink-500 p-2 rounded-full shadow-lg hover:bg-white"
                    >
                      <Download size={18} />
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
                  <div className="flex flex-wrap gap-1.5">
                    {item.optimized_prompt.split(',').slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[10px] bg-pink-50 text-pink-500 px-2 py-1 rounded-full font-medium">
                        {tag.trim()}
                      </span>
                    ))}
                    <span className="text-[10px] text-zinc-400 px-1 py-1">...</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}