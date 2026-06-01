'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Moon, Sun, Wand2, Star, Heart } from 'lucide-react';

export default function FlufforiaLanding() {
  // Local state just for the designer to test the themes easily
  const [isGothMode, setIsGothMode] = useState(false);

  return (
    <div className={`min-h-screen transition-colors duration-700 ${isGothMode ? 'dark' : ''}`}>
      {/* THEME WRAPPER 
        Light: Cream background with subtle pink vertical stripes
        Dark: Dark grey background with subtle purple diamond/lace texture
      */}
      <div className={`
        min-h-screen w-full font-sans
        ${isGothMode 
          ? 'bg-zinc-950 text-zinc-200 bg-[linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b),linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]' 
          : 'bg-[#FFFAF0] text-zinc-800 bg-[repeating-linear-gradient(to_right,transparent,transparent_40px,rgba(251,113,133,0.03)_40px,rgba(251,113,133,0.03)_80px)]'
        }
      `}>
        
        {/* NAVBAR */}
        <nav className={`border-b border-opacity-20 px-6 h-20 flex items-center justify-between backdrop-blur-sm sticky top-0 z-50 ${isGothMode ? 'border-purple-500 bg-zinc-950/80' : 'border-pink-300 bg-[#FFFAF0]/80'}`}>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shadow-sm transform rotate-3 ${isGothMode ? 'bg-purple-900 text-purple-200' : 'bg-pink-200 text-pink-600'}`}>
              <Sparkles size={20} />
            </div>
            {/* Using a placeholder for the Fredoka font */}
            <span className={`text-2xl font-bold tracking-wide ${isGothMode ? 'text-purple-100' : 'text-pink-500'}`} style={{ fontFamily: '"Fredoka", sans-serif' }}>
              Flufforia
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsGothMode(!isGothMode)}
              className={`p-2 rounded-full transition-all duration-300 ${isGothMode ? 'bg-zinc-900 text-purple-400 hover:bg-zinc-800 hover:text-purple-300' : 'bg-white text-blue-400 hover:bg-blue-50 hover:text-blue-500 shadow-sm'}`}
            >
              {isGothMode ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <Link 
              href="/auth" 
              className={`px-6 py-2.5 rounded-full font-bold transition-all transform hover:-translate-y-0.5 shadow-sm
                ${isGothMode 
                  ? 'bg-purple-900/40 text-purple-200 border border-purple-700/50 hover:bg-purple-800/50' 
                  : 'bg-white text-blue-500 border-2 border-blue-100 hover:border-blue-200 hover:shadow-md'
                }
              `}
            >
              Sign In
            </Link>
          </div>
        </nav>

        {/* HERO SECTION */}
        <main className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center">
          
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8 shadow-sm animate-fade-in
            ${isGothMode ? 'bg-zinc-900 border border-pink-900/50 text-pink-300' : 'bg-white border border-pink-100 text-pink-400'}
          `}>
            <Heart size={14} className={isGothMode ? "text-pink-400" : "text-pink-300"} />
            Welcome to the Studio
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight" style={{ fontFamily: '"Fredoka", sans-serif' }}>
            Bring your characters <br/>
            <span className={`relative inline-block ${isGothMode ? 'text-purple-400' : 'text-blue-400'}`}>
              to life.
              {/* Decorative underline */}
              <div className={`absolute -bottom-2 left-0 w-full h-3 rounded-full opacity-30 ${isGothMode ? 'bg-purple-500' : 'bg-blue-300'}`}></div>
            </span>
          </h1>

          <p className={`max-w-2xl text-lg mb-12 leading-relaxed ${isGothMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            A magical workspace to design, draft, and render beautiful assets. Write a tiny concept, and watch the magic unfold in our cozy studio.
          </p>

          {/* THE MAIN CTA BUTTON 
            Light: Scalloped/Dotted texture look
            Dark: Sharp, deep border look
          */}
          <Link 
            href="/studio"
            className={`group relative px-8 py-4 rounded-full font-bold text-lg overflow-hidden transition-all transform hover:-translate-y-1 hover:shadow-xl flex items-center gap-3
              ${isGothMode 
                ? 'bg-zinc-900 text-pink-300 border-2 border-pink-900/50 shadow-[0_0_15px_rgba(244,114,182,0.1)] hover:border-pink-500/50 hover:bg-zinc-800' 
                : 'bg-pink-300 text-white shadow-[0_4px_0_rgba(244,114,182,0.6)] hover:bg-pink-400 hover:shadow-[0_6px_0_rgba(244,114,182,0.6)]'
              }
            `}
          >
            {/* CSS Polka Dot overlay for light mode button */}
            {!isGothMode && (
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_2px,transparent_2px)] bg-[size:10px_10px]"></div>
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Wand2 size={20} className={isGothMode ? "text-purple-400" : "text-white"} />
              Enter the Studio
            </span>
          </Link>

          {/* DECORATIVE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full">
            {[
              { title: "Dreamy Drafts", icon: <Star size={24}/>, desc: "Write your backstory and let the engine weave the perfect visual tags." },
              { title: "Cozy Render", icon: <Heart size={24}/>, desc: "High-quality, flawless character generation in seconds." },
              { title: "Your Collection", icon: <Sparkles size={24}/>, desc: "A private gallery of all your magical creations." }
            ].map((card, i) => (
              <div key={i} className={`p-8 rounded-3xl text-left transition-all hover:-translate-y-1
                ${isGothMode 
                  ? 'bg-zinc-900/80 border border-zinc-800 hover:border-purple-500/30' 
                  : 'bg-white shadow-sm border border-orange-50 hover:shadow-md'
                }
              `}>
                <div className={`mb-4 w-12 h-12 rounded-2xl flex items-center justify-center
                  ${isGothMode ? 'bg-zinc-950 text-purple-400 border border-zinc-800' : 'bg-blue-50 text-blue-400'}
                `}>
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: '"Fredoka", sans-serif' }}>{card.title}</h3>
                <p className={`text-sm ${isGothMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{card.desc}</p>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}