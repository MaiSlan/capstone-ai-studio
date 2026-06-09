'use client';

import React, { useEffect } from 'react';
import { 
  Database, Globe, Server, Cpu, Brain, Eraser, 
  ArrowDown, ShieldCheck, Zap, Layers, Code2, 
  Workflow, Lock, HardDrive 
} from 'lucide-react';
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
            A comprehensive technical specification of the Flufforia cloud orchestration, microservices, and serverless AI pipeline.
          </p>
          
          <div className="mt-8 flex justify-center">
            <Link href="/architecture/workflow" className="text-sm font-bold text-pink-500 dark:text-purple-400 hover:text-pink-600 dark:hover:text-purple-300 flex items-center gap-2 bg-white dark:bg-zinc-900 px-6 py-3 rounded-full shadow-sm border border-pink-100 dark:border-zinc-800 transition-all hover:shadow-md hover:-translate-y-0.5">
              <Workflow size={16} /> View Low-Level Tensor Pipeline
            </Link>
          </div>
        </div>

        {/* SECTION 1: THE LAYERED STACK DIAGRAM */}
        <div className="mb-24">
          <h2 className="text-xl font-bold uppercase tracking-widest text-pink-400 dark:text-purple-400 mb-8 text-center transition-colors">
            Layered Topology
          </h2>
          
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
            
            {/* Layer 1: Edge */}
            <div className="w-full bg-white dark:bg-zinc-900/90 border border-pink-100 dark:border-purple-500/30 rounded-3xl p-6 shadow-sm transition-colors flex flex-col md:flex-row items-center gap-6">
              <div className="bg-pink-100 dark:bg-purple-900/30 p-4 rounded-2xl text-pink-500 dark:text-purple-400 shrink-0">
                <Globe size={32} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-1">Layer 1: The Edge (Vercel)</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Next.js App Router providing SSR, global CDN caching, and secure API Proxy Routes to mask backend infrastructure.</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                <Badge text="React 18" />
                <Badge text="TailwindCSS" />
              </div>
            </div>

            <ArrowDown size={24} className="text-pink-200 dark:text-purple-900/50" />

            {/* Layer 2: State */}
            <div className="w-full bg-white dark:bg-zinc-900/90 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl p-6 shadow-sm transition-colors flex flex-col md:flex-row items-center gap-6">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-2xl text-emerald-500 dark:text-emerald-400 shrink-0">
                <Database size={32} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-1">Layer 2: State & Auth (Supabase)</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">PostgreSQL cluster managing JWT issuance, Row Level Security (RLS), and server-side token ledgers.</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                <Badge text="PostgreSQL" />
                <Badge text="JWT Auth" />
              </div>
            </div>

            <ArrowDown size={24} className="text-pink-200 dark:text-purple-900/50" />

            {/* Layer 3: Orchestration */}
            <div className="w-full bg-white dark:bg-zinc-900/90 border border-blue-100 dark:border-blue-900/30 rounded-3xl p-6 shadow-sm transition-colors flex flex-col md:flex-row items-center gap-6">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-2xl text-blue-500 dark:text-blue-400 shrink-0">
                <Server size={32} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-1">Layer 3: Orchestration (Render)</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">FastAPI Python backend. Handles CORS, payload sanitization, stateful long-polling, and microservice routing.</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                <Badge text="FastAPI" />
                <Badge text="Uvicorn" />
              </div>
            </div>

            <ArrowDown size={24} className="text-pink-200 dark:text-purple-900/50" />

            {/* Layer 4: AI Compute Cluster */}
            <div className="w-full bg-zinc-50 dark:bg-zinc-950 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-6 shadow-inner transition-colors">
              <h3 className="text-center text-sm font-bold uppercase tracking-widest text-amber-500 mb-6">Layer 4: Serverless AI Compute Cluster</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col items-center text-center shadow-sm">
                  <Brain size={24} className="text-amber-500 mb-2" />
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">Groq LPU</h4>
                  <p className="text-xs text-zinc-500 mt-2">Llama-3 70B generating structured lore and ComfyUI tags via ultra-fast inference.</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col items-center text-center shadow-sm">
                  <Cpu size={24} className="text-amber-500 mb-2" />
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">Modal A10G (Generative)</h4>
                  <p className="text-xs text-zinc-500 mt-2">Serverless container executing SDXL and dynamic LoRAs via headless ComfyUI.</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col items-center text-center shadow-sm">
                  <Eraser size={24} className="text-amber-500 mb-2" />
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">Modal CPU (Extraction)</h4>
                  <p className="text-xs text-zinc-500 mt-2">Isolated microservice running <code>isnet-anime</code> for instant, precise background removal.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 2: DEEP DIVE DETAILS */}
        <div className="space-y-16">
          
          {/* Security & Auth */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck size={28} className="text-pink-500 dark:text-purple-400" />
                <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100" style={{ fontFamily: '"Fredoka", sans-serif' }}>Security & State</h2>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                The platform employs a zero-trust architecture. No backend resource can be accessed without cryptographic verification originating from the Edge.
              </p>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailBlock 
                icon={<Lock />} title="Edge Route Guards" 
                desc="Next.js Middleware intercepts all protected route requests, ensuring a valid Supabase JWT is present in cookies before delivering React Server Components."
              />
              <DetailBlock 
                icon={<Database />} title="Row Level Security" 
                desc="PostgreSQL policies strictly isolate data. Users can only SELECT or UPDATE their own `profiles` row, making token spoofing mathematically impossible."
              />
              <DetailBlock 
                icon={<Code2 />} title="Server-Side Deductions" 
                desc="Tokens are NEVER deducted by the client browser. Token updates occur entirely within Next.js API Routes during the microservice handoff."
              />
              <DetailBlock 
                icon={<Zap />} title="Rate Limiting" 
                desc="Supabase inherently rate-limits Auth endpoints (emails, password resets) to prevent automated bot exhaustion attacks."
              />
            </div>
          </div>

          <hr className="border-pink-100 dark:border-zinc-800" />

          {/* AI Orchestration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <Layers size={28} className="text-pink-500 dark:text-purple-400" />
                <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100" style={{ fontFamily: '"Fredoka", sans-serif' }}>AI Orchestration</h2>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                The heavy lifting is decentralized. Tasks are routed to specialized, serverless hardware optimized for the specific tensor math required.
              </p>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailBlock 
                icon={<Brain />} title="Groq Pipeline" 
                desc="User concepts hit Groq's specialized LPUs. Utilizing Llama-3 70B, it expands short phrases into detailed Markdown lore and precise Danbooru visual tags in under 800ms."
              />
              <DetailBlock 
                icon={<Workflow />} title="Dynamic ComfyUI Graph" 
                desc="The Render orchestrator injects Groq's tags into a master ComfyUI JSON graph. It dynamically swaps `.safetensors` LoRAs depending on the requested asset profile."
              />
              <DetailBlock 
                icon={<Cpu />} title="Cold Start Mitigation" 
                desc="Modal GPUs scale to zero. When awoken, Render implements a polling loop to keep the client connection alive while the GPU loads 6GB of weights into VRAM."
              />
              <DetailBlock 
                icon={<Eraser />} title="Model Baking (U-2-Net)" 
                desc="The background removal service downloads the `isnet-anime.onnx` weights during the container build phase, ensuring instant inference at runtime."
              />
            </div>
          </div>

          <hr className="border-pink-100 dark:border-zinc-800" />

          {/* Data Schema */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <HardDrive size={28} className="text-pink-500 dark:text-purple-400" />
                <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100" style={{ fontFamily: '"Fredoka", sans-serif' }}>Database Schema</h2>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                A lightweight footprint leveraging Supabase for structured data and browser `localStorage` for high-speed client asset caching.
              </p>
            </div>
            <div className="md:col-span-2">
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden font-mono text-sm shadow-xl">
                <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-800 flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="p-6 text-zinc-300 space-y-4">
                  <div>
                    <span className="text-pink-400">Table:</span> profiles
                    <br/>
                    <span className="text-zinc-500">-- Linked via trigger to auth.users</span>
                    <ul className="pl-4 mt-1 space-y-1">
                      <li><span className="text-blue-400">id</span>: uuid (PK)</li>
                      <li><span className="text-blue-400">email</span>: text</li>
                      <li><span className="text-blue-400">tokens</span>: integer (Default: 5)</li>
                      <li><span className="text-blue-400">created_at</span>: timestamp</li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-zinc-800">
                    <span className="text-emerald-400">Client-Side Cache:</span> localStorage['aiStudioHistory']
                    <br/>
                    <span className="text-zinc-500">-- Prevents DB bloat from heavy Base64 strings</span>
                    <ul className="pl-4 mt-1 space-y-1">
                      <li><span className="text-blue-400">id</span>: string (Render Job ID)</li>
                      <li><span className="text-blue-400">theme</span>: string (User Concept)</li>
                      <li><span className="text-blue-400">lore</span>: string (Groq Output)</li>
                      <li><span className="text-blue-400">images</span>: array[string] (Base64)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// Micro-components for cleaner code

function Badge({ text }: { text: string }) {
  return (
    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-md uppercase tracking-widest font-bold border border-zinc-200 dark:border-zinc-700">
      {text}
    </span>
  );
}

function DetailBlock({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900/90 border border-pink-100 dark:border-purple-500/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-pink-400 dark:text-purple-400 mb-3">{icon}</div>
      <h4 className="font-bold text-zinc-800 dark:text-zinc-100 text-sm mb-2">{title}</h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  );
}