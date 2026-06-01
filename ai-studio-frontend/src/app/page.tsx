'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Wand2, Star, Heart } from 'lucide-react';

export default function FlufforiaLanding() {
  return (
    <div className="min-h-screen w-full font-sans bg-[#FFFAF0] dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 transition-colors duration-700 bg-[repeating-linear-gradient(to_right,transparent,transparent_40px,rgba(251,113,133,0.03)_40px,rgba(251,113,133,0.03)_80px)] dark:bg-[linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b),linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b)] dark:bg-[length:20px_20px] dark:bg-[position:0_0,10px_10px]">
      
      {/* HERO SECTION - Added pt-32 to account for floating navbar */}
      <main className="max-w-5xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center text-center">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8 shadow-sm animate-fade-in bg-white dark:bg-zinc-900 border border-pink-100 dark:border-purple-900/50 text-pink-400 dark:text-purple-300">
          <Heart size={14} className="text-pink-300 dark:text-purple-400" />
          Welcome to the Studio
        </div>

        <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight" style={{ fontFamily: '"Fredoka", sans-serif' }}>
          Bring your characters <br/>
          <span className="relative inline-block text-blue-400 dark:text-purple-400">
            to life.
            <div className="absolute -bottom-2 left-0 w-full h-3 rounded-full opacity-30 bg-blue-300 dark:bg-purple-500"></div>
          </span>
        </h1>

        <p className="max-w-2xl text-lg mb-12 leading-relaxed text-zinc-500 dark:text-zinc-400">
          A magical workspace to design, draft, and render beautiful assets. Write a tiny concept, and watch the magic unfold in our cozy studio.
        </p>

        <Link 
          href="/studio"
          className="group relative px-8 py-4 rounded-full font-bold text-lg overflow-hidden transition-all transform hover:-translate-y-1 flex items-center gap-3 bg-pink-300 dark:bg-zinc-900 text-white dark:text-purple-300 shadow-[0_4px_0_rgba(244,114,182,0.6)] dark:shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:bg-pink-400 dark:hover:bg-zinc-800 hover:shadow-[0_6px_0_rgba(244,114,182,0.6)] dark:border-2 dark:border-purple-900/50 dark:hover:border-purple-500/50"
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_2px,transparent_2px)] bg-[size:10px_10px] dark:hidden"></div>
          <span className="relative z-10 flex items-center gap-2">
            <Wand2 size={20} className="text-white dark:text-purple-400" />
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
            <div key={i} className="p-8 rounded-3xl text-left transition-all hover:-translate-y-1 bg-white dark:bg-zinc-900/80 shadow-sm border border-orange-50 dark:border-zinc-800 hover:shadow-md dark:hover:border-purple-500/30">
              <div className="mb-4 w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-zinc-950 text-blue-400 dark:text-purple-400 dark:border dark:border-zinc-800">
                {card.icon}
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: '"Fredoka", sans-serif' }}>{card.title}</h3>
              <p className="text-sm text-zinc-500">{card.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}