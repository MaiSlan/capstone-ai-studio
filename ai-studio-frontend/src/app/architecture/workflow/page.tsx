import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Box, Image as ImageIcon, Sliders, Layers, Cpu, Code } from 'lucide-react';

export default function WorkflowPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] p-8 max-w-4xl mx-auto animate-fade-in">
      <Link href="/architecture" className="text-zinc-500 hover:text-green-400 flex items-center gap-2 text-sm transition-colors mb-8 w-fit">
        <ArrowLeft size={16} /> Back to Architecture
      </Link>

      <div className="mb-12 border-b border-zinc-800 pb-8">
        <h1 className="text-3xl font-bold text-zinc-50 tracking-tight mb-2">ComfyUI Tensor Pipeline</h1>
        <p className="text-zinc-400">Low-level execution graph for the Stable Diffusion XL image generation sequence.</p>
      </div>

      <div className="relative border-l-2 border-zinc-800 ml-6 space-y-12 pb-8">
        
        <WorkflowNode 
          icon={<Box />} 
          title="Checkpoint Loader" 
          nodeId="Node 8"
          details="waiIllustriousSDXL_v130.safetensors"
          desc="Loads the primary Stable Diffusion XL foundation model weights into VRAM."
        />

        <WorkflowNode 
          icon={<Layers />} 
          title="LoRA Injection" 
          nodeId="Node 16"
          details="yuzusoft-chibiV2.safetensors (Strength: 1.15)"
          desc="Applies low-rank adaptation weights to heavily bias the model toward the specific art style."
        />

        <WorkflowNode 
          icon={<Code />} 
          title="CLIP Text Encode" 
          nodeId="Nodes 9 & 10"
          details="Positive & Negative Conditioning"
          desc="Translates the optimized Danbooru tags into high-dimensional vector embeddings."
        />

        <WorkflowNode 
          icon={<Sliders />} 
          title="Latent Space Initialization" 
          nodeId="Node 11"
          details="1024x1024 Empty Latent Image"
          desc="Generates the initial pure noise tensor at the optimal SDXL resolution."
        />

        <WorkflowNode 
          icon={<Cpu />} 
          title="K-Sampler" 
          nodeId="Node 12"
          details="Euler Sampler, Karras Scheduler, 25 Steps, CFG 7"
          desc="Iteratively denoises the latent space guided by the CLIP embeddings to construct the image."
        />

        <WorkflowNode 
          icon={<ImageIcon />} 
          title="VAE Decode & Save" 
          nodeId="Nodes 13 & 14"
          details="RawHighRes Output"
          desc="Decodes the final latent tensor back into pixel space and saves the base64 payload."
        />

      </div>
    </div>
  );
}

function WorkflowNode({ icon, title, nodeId, details, desc }: { icon: React.ReactNode, title: string, nodeId: string, details: string, desc: string }) {
  return (
    <div className="relative pl-10 group">
      {/* Timeline Node Dot */}
      <div className="absolute -left-[21px] top-2 h-10 w-10 rounded-full bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:border-green-500 group-hover:text-green-500 transition-colors shadow-sm">
        <div className="scale-75">{icon}</div>
      </div>
      
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
            {nodeId}
          </span>
          <h3 className="text-zinc-100 font-semibold">{title}</h3>
        </div>
        <div className="font-mono text-xs text-zinc-400 bg-zinc-950 px-3 py-2 rounded-md border border-zinc-800 mb-3">
          {details}
        </div>
        <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}