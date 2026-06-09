'use client';

import React, { useEffect } from 'react';
import { Database, Globe, Server, Cpu, ArrowDown, Brain, Eraser } from 'lucide-react';
import Link from 'next/link';

export default function ArchitecturePage() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('flufforia-theme');
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-[#FFFAF0] dark:bg-zinc-950 transition-colors duration-700 bg-[repeating-linear-gradient(to_right,transparent,transparent_40px,rgba(251,113,133,0.03)_40px,rgba(251,113,133,0.03)_80px)] dark:bg-[linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b),linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b)] dark:bg-[length:20px_20px] dark:bg-[position:0_0,10px_10px]">
      <div className="max-w-5xl mx-auto animate-fade-in">
        
        <div className="mb-12 border-b border-pink-100 dark:border-zinc-800 pb-8 transition-colors">
          <h1 className="text-4xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight mb-2 transition-colors" style={{ fontFamily: '"Fredoka", sans-serif' }}>
            System Architecture
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 transition-colors">Technical overview of the cloud orchestration and data pipeline.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column: Flow Diagram Representation */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-pink-400 dark:text-purple-400 mb-6 transition-colors">Data Flow</h2>
            
            <ArchitectureNode 
              icon={<Globe size={20} />} 
              title="Next.js Frontend" 
              tech="Vercel Edge"
              desc="Handles UI state, Supabase session validation, and base64 asset decoding."
            />
            <FlowArrow />
            
            <ArchitectureNode 
              icon={<Database size={20} />} 
              title="PostgreSQL" 
              tech="Supabase"
              desc="Row Level Security, user authentication, and strict token management."
            />
            <FlowArrow />

            <ArchitectureNode 
              icon={<Server size={20} />} 
              title="FastAPI Orchestrator" 
              tech="Render Cloud"
              desc="Central backend hub. Manages CORS, routes requests, and sanitizes payload injections."
            />
            <FlowArrow />
            
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <div className="flex-1 space-y-4">
                <ArchitectureNode 
                  icon={<Brain size={20} />} 
                  title="LLM Engine" 
                  tech="Groq Llama 3"
                  desc="Ultrafast inference to expand basic concepts into structured ComfyUI tags."
                />
              </div>
              <div className="flex-1 space-y-4">
                <ArchitectureNode 
                  icon={<Cpu size={20} />} 
                  title="Serverless GPU" 
                  tech="Modal A10G"
                  desc="Executes JSON payloads against SDXL safetensors and LoRAs."
                />
              </div>
            </div>
          </div>

          {/* Right Column: Technical Details */}
          <div className="bg-white dark:bg-zinc-900/90 border border-pink-100 dark:border-purple-500/30 rounded-[2rem] p-8 h-fit shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(168,85,247,0.05)] transition-all duration-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 transition-colors">Infrastructure Details</h2>
              <Link href="/architecture/workflow" className="text-xs font-bold text-pink-500 dark:text-purple-400 hover:underline">View Pipeline &rarr;</Link>
            </div>
            
            <ul className="space-y-6">
              <li className="space-y-1">
                <span className="text-pink-500 dark:text-purple-400 font-bold text-sm block transition-colors">01. Serverless Microservices</span>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed transition-colors">The architecture completely isolates the frontend, standard API, and GPU workloads. This prevents heavy image generation from blocking standard web traffic.</p>
              </li>
              <li className="space-y-1">
                <span className="text-pink-500 dark:text-purple-400 font-bold text-sm block transition-colors">02. Edge Authentication</span>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed transition-colors">Route Guards intercept requests at the network edge, ensuring the Studio and API routes remain inaccessible without a verified JWT cookie from Supabase.</p>
              </li>
              <li className="space-y-1">
                <span className="text-pink-500 dark:text-purple-400 font-bold text-sm block transition-colors">03. Magic Eraser Bypass</span>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed transition-colors">Background removal tasks bypass the Render orchestrator entirely. The Next.js API securely verifies tokens and sends the image directly to the isolated <code>isnet-anime</code> Modal container.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchitectureNode({ icon, title, tech, desc }: { icon: React.ReactNode, title: string, tech: string, desc: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900/90 border border-pink-100 dark:border-purple-500/30 rounded-2xl p-4 flex gap-4 items-start shadow-sm hover:shadow-md transition-all duration-300">
      <div className="bg-pink-100 dark:bg-purple-900/50 text-pink-500 dark:text-purple-400 p-2.5 rounded-xl shrink-0 mt-1 transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2 transition-colors">
          {title} <span className="text-[10px] bg-pink-50 dark:bg-purple-900/30 border border-pink-200 dark:border-purple-500/30 text-pink-600 dark:text-purple-300 px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors">{tech}</span>
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed transition-colors">{desc}</p>
      </div>
    </div>
  );
}

function FlowArrow() {
  return <div className="flex justify-center text-pink-200 dark:text-purple-900 py-2 transition-colors"><ArrowDown size={20} /></div>;
}