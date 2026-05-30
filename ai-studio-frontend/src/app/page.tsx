import React from 'react';
import Link from 'next/link';
import { Cpu, Layers, Zap, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 max-w-3xl space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-green-400 font-medium tracking-wide">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          V1.0 ENGINE LIVE
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-50 leading-tight">
          Industrial-Grade <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
            Asset Generation.
          </span>
        </h1>
        
        <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
          A cloud-orchestrated pipeline powered by Modal GPUs and LangGraph. 
          Generate high-fidelity concepts and sprites instantly.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Link href="/auth" className="bg-green-500 hover:bg-green-600 text-zinc-950 px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-2 group">
            Start Generating
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/architecture" className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-8 py-4 rounded-xl font-medium transition-colors">
            View Architecture
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-32">
        <FeatureCard icon={<Cpu />} title="Modal Cloud GPUs" desc="Zero cold-boot delays. Serverless A10G processing power." />
        <FeatureCard icon={<Layers />} title="LangGraph Routing" desc="Agentic workflow handling lore generation and tag optimization." />
        <FeatureCard icon={<Zap />} title="HD Render Engine" desc="SDXL powered by custom LoRA routing for perfect consistency." />
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 p-6 rounded-2xl text-left backdrop-blur-sm">
      <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-green-500 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-zinc-100 mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  );
}