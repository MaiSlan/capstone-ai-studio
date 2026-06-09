'use client';

import React, { useEffect } from 'react';
import { Database, Globe, Server, Cpu, Brain, Eraser, ArrowDown, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ArchitecturePage() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('flufforia-theme');
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-[#FFFAF0] dark:bg-zinc-950 transition-colors duration-700 bg-[repeating-linear-gradient(to_right,transparent,transparent_40px,rgba(251,113,133,0.03)_40px,rgba(251,113,133,0.03)_80px)] dark:bg-[linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b),linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b)] dark:bg-[length:20px_20px] dark:bg-[position:0_0,10px_10px]">
      <div className="max-w-6xl mx-auto animate-fade-in">
        
        {/* Header */}
        <div className="mb-16 border-b border-pink-100 dark:border-zinc-800 pb-8 transition-colors text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight mb-4 transition-colors" style={{ fontFamily: '"Fredoka", sans-serif' }}>
            System Architecture
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 transition-colors max-w-2xl mx-auto">
            A comprehensive overview of the Flufforia cloud orchestration, microservices, and serverless AI pipeline.
          </p>
        </div>

        {/* SECTION 1: THE VISUAL DATA FLOW DIAGRAM */}
        <div className="mb-24">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-xl font-bold uppercase tracking-widest text-pink-400 dark:text-purple-400 transition-colors">Data Flow Topology</h2>
            <Link href="/architecture/workflow" className="text-sm font-bold text-pink-500 dark:text-purple-400 hover:underline flex items-center gap-2 bg-white dark:bg-zinc-900 px-4 py-2 rounded-full shadow-sm border border-pink-100 dark:border-zinc-800 transition-colors">
              View Tensor Pipeline &rarr;
            </Link>
          </div>
          
          <div className="bg-white dark:bg-zinc-900/90 border border-pink-100 dark:border-purple-500/30 rounded-[3rem] p-8 md:p-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(168,85,247,0.05)] overflow-x-auto transition-all duration-700">
            <div className="min-w-[800px] flex flex-col items-center">
              
              {/* Tier 1: Frontend Hub */}
              <div className="flex flex-col items-center relative z-10">
                <DiagramNode icon={<Globe size={24} />} title="Next.js Frontend" tech="Vercel Edge" color="pink" />
                <div className="h-12 w-0.5 bg-zinc-200 dark:bg-zinc-700 my-2"></div>
              </div>

              {/* Tier 2: The Three Pillars */}
              <div className="flex w-full justify-center relative">
                {/* Horizontal connection line */}
                <div className="absolute top-0 w-2/3 h-0.5 bg-zinc-200 dark:bg-zinc-700 -z-10"></div>
                
                <div className="flex justify-between w-4/5">
                  
                  {/* Left Path: Database */}
                  <div className="flex flex-col items-center w-1/3">
                    <div className="h-8 w-0.5 bg-zinc-200 dark:bg-zinc-700 mb-2"></div>
                    <DiagramNode icon={<Database size={24} />} title="PostgreSQL" tech="Supabase" color="green" />
                  </div>

                  {/* Center Path: Orchestrator */}
                  <div className="flex flex-col items-center w-1/3">
                    <DiagramNode icon={<Server size={24} />} title="FastAPI Orchestrator" tech="Render Cloud" color="blue" />
                    <div className="h-12 w-0.5 bg-zinc-200 dark:bg-zinc-700 my-2"></div>
                  </div>

                  {/* Right Path: Tool Bypass */}
                  <div className="flex flex-col items-center w-1/3">
                    <div className="h-8 w-0.5 bg-zinc-200 dark:bg-zinc-700 mb-2"></div>
                    <DiagramNode icon={<Eraser size={24} />} title="Eraser Microservice" tech="Modal (isnet-anime)" color="purple" />
                  </div>

                </div>
              </div>

              {/* Tier 3: The AI Muscles (From Orchestrator) */}
              <div className="flex w-[40%] justify-between relative mt-2">
                {/* Horizontal connection line for bottom tier */}
                <div className="absolute top-0 w-full h-0.5 bg-zinc-200 dark:bg-zinc-700 -z-10"></div>
                
                <div className="flex flex-col items-center">
                  <div className="h-8 w-0.5 bg-zinc-200 dark:bg-zinc-700 mb-2"></div>
                  <DiagramNode icon={<Brain size={24} />} title="LLM Engine" tech="Groq Llama-3" color="amber" />
                </div>

                <div className="flex flex-col items-center">
                  <div className="h-8 w-0.5 bg-zinc-200 dark:bg-zinc-700 mb-2"></div>
                  <DiagramNode icon={<Cpu size={24} />} title="ComfyUI Pipeline" tech="Modal (SDXL GPU)" color="amber" />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* SECTION 2: COMPREHENSIVE RUNDOWN */}
        <div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-pink-400 dark:text-purple-400 mb-10 transition-colors">Infrastructure Deep Dive</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <DetailCard 
              number="01"
              title="The Frontend Hub (Vercel)"
              desc="Built on Next.js App Router, the frontend acts as the secure gatekeeper. Server-Side Rendering (SSR) checks user JWT cookies at the network edge before delivering pages. API proxy routes hide third-party URLs and orchestrate secure binary file transfers (like image uploads) without exposing backend infrastructure."
            />

            <DetailCard 
              number="02"
              title="State & Security (Supabase)"
              desc="Provides PostgreSQL infrastructure heavily fortified by Row Level Security (RLS). Beyond standard OAuth and email authentication, Supabase acts as the platform's ledger. The `profiles` table tracks token economies, ensuring API routes deduct tokens server-side to completely prevent client-side manipulation."
            />

            <DetailCard 
              number="03"
              title="The Orchestrator (Render)"
              desc="A FastAPI application that serves as the traffic controller. It receives raw concepts from Vercel, formats inference requests for Groq, and dynamically injects the resulting data into massive JSON execution graphs. It handles long-polling connections (`/render-status`) to keep the frontend updated during 60-second GPU cold starts."
            />

            <DetailCard 
              number="04"
              title="Neural Reasoning (Groq)"
              desc="Leverages the Llama-3 language model on custom LPUs (Language Processing Units) for lightning-fast inference. It takes a user's simple prompt and expands it into rich, logical backstory lore, while simultaneously translating the visual concepts into the highly specific, comma-separated Danbooru tags required by SDXL."
            />

            <DetailCard 
              number="05"
              title="Tensor Compute (Modal GPU)"
              desc="Serverless Python containers attached to A10G or A100 GPUs. They remain asleep to save costs until triggered by Render. Once awake, they execute a headless ComfyUI environment, downloading specific Civitai Safetensors and LoRAs into VRAM dynamically based on the requested asset profile (Character, Weapon, etc.)."
            />

            <DetailCard 
              number="06"
              title="Isolated Microservices"
              desc="Certain high-frequency tools bypass the Render Orchestrator entirely. The Magic Eraser relies on an isolated Modal container running the specialized `isnet-anime.onnx` model. Next.js streams binary `application/octet-stream` data directly to this container for sub-second background removal that doesn't block the main generative queue."
            />

          </div>
        </div>

      </div>
    </div>
  );
}

// Helper Components

function DiagramNode({ icon, title, tech, color }: { icon: React.ReactNode, title: string, tech: string, color: 'pink' | 'green' | 'blue' | 'purple' | 'amber' }) {
  const colorStyles = {
    pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-500 border-pink-200 dark:border-pink-800",
    green: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 border-emerald-200 dark:border-emerald-800",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-500 border-blue-200 dark:border-blue-800",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-500 border-purple-200 dark:border-purple-800",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-500 border-amber-200 dark:border-amber-800",
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col items-center text-center w-56 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 z-10">
      <div className={`p-3 rounded-xl mb-3 border ${colorStyles[color]} transition-colors`}>
        {icon}
      </div>
      <h3 className="font-bold text-zinc-800 dark:text-zinc-100 text-sm mb-1 transition-colors">{title}</h3>
      <span className="text-[10px] bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-md uppercase tracking-widest font-semibold transition-colors">
        {tech}
      </span>
    </div>
  );
}

function DetailCard({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900/90 border border-pink-100 dark:border-purple-500/30 rounded-3xl p-8 shadow-sm hover:shadow-[0_8px_30px_rgba(244,114,182,0.08)] dark:hover:shadow-[0_8px_30px_rgba(168,85,247,0.08)] transition-all duration-300">
      <div className="flex items-center gap-4 mb-4">
        <span className="text-3xl font-bold text-pink-200 dark:text-purple-900/50 transition-colors" style={{ fontFamily: '"Fredoka", sans-serif' }}>
          {number}
        </span>
        <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 transition-colors">
          {title}
        </h3>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed transition-colors">
        {desc}
      </p>
    </div>
  );
}