import React from 'react';
import { Database, Globe, Server, Cpu, ArrowDown } from 'lucide-react';

export default function ArchitecturePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-12 border-b border-zinc-800 pb-8">
        <h1 className="text-3xl font-bold text-zinc-50 tracking-tight mb-2">System Architecture</h1>
        <p className="text-zinc-400">Technical overview of the cloud orchestration and data pipeline.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Column: Flow Diagram Representation */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-green-500 mb-6">Data Flow</h2>
          
          <ArchitectureNode 
            icon={<Globe className="text-zinc-900" size={20} />} 
            title="Next.js Frontend" 
            tech="Vercel Edge Network"
            desc="Handles UI state, Supabase session validation, and base64 asset decoding."
          />
          <FlowArrow />
          <ArchitectureNode 
            icon={<Server className="text-zinc-900" size={20} />} 
            title="FastAPI Orchestrator" 
            tech="Render Cloud"
            desc="Central backend hub. Manages CORS, routes requests, and sanitizes payload injections."
          />
          
          <div className="flex gap-4 w-full">
            <div className="flex-1 space-y-4">
              <FlowArrow />
              <ArchitectureNode 
                icon={<Database className="text-zinc-900" size={20} />} 
                title="PostgreSQL" 
                tech="Supabase"
                desc="Row Level Security, user tokens, and session management."
              />
            </div>
            <div className="flex-1 space-y-4">
              <FlowArrow />
              <ArchitectureNode 
                icon={<Cpu className="text-zinc-900" size={20} />} 
                title="Serverless GPU" 
                tech="Modal A10G"
                desc="Executes JSON payloads against SDXL safetensors."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Technical Details */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 h-fit shadow-xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-6">Infrastructure Details</h2>
          <ul className="space-y-6">
            <li className="space-y-1">
              <span className="text-green-400 font-mono text-sm block">01. Monorepo Strategy</span>
              <p className="text-sm text-zinc-400 leading-relaxed">The repository isolates the Node environment from the Python virtual environment, allowing independent build triggers on Vercel and Render.</p>
            </li>
            <li className="space-y-1">
              <span className="text-green-400 font-mono text-sm block">02. Edge Authentication</span>
              <p className="text-sm text-zinc-400 leading-relaxed">Middleware intercepts requests at the network edge, ensuring the workspace route remains inaccessible without a verified JWT cookie.</p>
            </li>
            <li className="space-y-1">
              <span className="text-green-400 font-mono text-sm block">03. Payload Injection</span>
              <p className="text-sm text-zinc-400 leading-relaxed">Dynamic strings are injected into a strict JSON template, preventing pipeline breakage when transmitting to the Modal GPU volume.</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ArchitectureNode({ icon, title, tech, desc }: { icon: React.ReactNode, title: string, tech: string, desc: string }) {
  return (
    <div className="bg-zinc-950 border border-green-900/50 rounded-lg p-4 flex gap-4 items-start shadow-sm hover:border-green-500/50 transition-colors">
      <div className="bg-green-500 p-2 rounded shrink-0 mt-1">{icon}</div>
      <div>
        <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
          {title} <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded uppercase tracking-wider">{tech}</span>
        </h3>
        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function FlowArrow() {
  return <div className="flex justify-center text-zinc-800 py-1"><ArrowDown size={20} /></div>;
}