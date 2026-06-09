'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Box, Image as ImageIcon, Sliders, Layers, Cpu, Code, Eraser } from 'lucide-react';

export default function WorkflowPage() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('flufforia-theme');
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-[#FFFAF0] dark:bg-zinc-950 transition-colors duration-700 bg-[repeating-linear-gradient(to_right,transparent,transparent_40px,rgba(251,113,133,0.03)_40px,rgba(251,113,133,0.03)_80px)] dark:bg-[linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b),linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b)] dark:bg-[length:20px_20px] dark:bg-[position:0_0,10px_10px]">
      <div className="max-w-4xl mx-auto animate-fade-in">
        
        <Link href="/architecture" className="absolute top-24 left-8 text-zinc-500 dark:text-zinc-400 hover:text-pink-500 dark:hover:text-purple-400 flex items-center gap-2 text-sm font-medium transition-colors bg-white/50 dark:bg-zinc-900/50 backdrop-blur px-4 py-2 rounded-full border border-pink-100 dark:border-zinc-800 shadow-sm">
          <ArrowLeft size={16} /> Back to Hub
        </Link>

        <div className="mb-12 border-b border-pink-100 dark:border-zinc-800 pb-8 transition-colors mt-8">
          <h1 className="text-4xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight mb-2 transition-colors" style={{ fontFamily: '"Fredoka", sans-serif' }}>
            Tensor Pipeline
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 transition-colors">Low-level execution graph for the Stable Diffusion XL image generation sequence.</p>
        </div>

        <div className="relative border-l-2 border-pink-200 dark:border-purple-900/50 ml-6 space-y-12 pb-8 transition-colors">
          
          <WorkflowNode 
            icon={<Box />} 
            title="Checkpoint Loader" 
            nodeId="Node 8"
            details="waiIllustriousSDXL_v130.safetensors"
            desc="Loads the primary Stable Diffusion XL foundation model weights into VRAM."
          />

          <WorkflowNode 
            icon={<Layers />} 
            title="Dynamic LoRA Injection" 
            nodeId="Node 16"
            details="Asset Profile Safetensors (Strength: 1.15)"
            desc="Applies low-rank adaptation weights dynamically based on whether the user is generating a character, weapon, or environment."
          />

          <WorkflowNode 
            icon={<Code />} 
            title="CLIP Text Encode" 
            nodeId="Nodes 9 & 10"
            details="Groq Output (Positive & Negative Conditioning)"
            desc="Translates the AI-optimized Danbooru tags into high-dimensional vector embeddings."
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
            details="RawHighRes Output (Base64)"
            desc="Decodes the final latent tensor back into pixel space and packages it as a base64 string for the UI."
          />

          <WorkflowNode 
            icon={<Eraser />} 
            title="U-2-Net Extraction (Optional)" 
            nodeId="Microservice API"
            details="isnet-anime.onnx"
            desc="If triggered by the user, the base64 image is passed to a secondary Modal container to strip the background using an Anime-specific AI model."
          />

        </div>
      </div>
    </div>
  );
}

function WorkflowNode({ icon, title, nodeId, details, desc }: { icon: React.ReactNode, title: string, nodeId: string, details: string, desc: string }) {
  return (
    <div className="relative pl-10 group">
      {/* Timeline Node Dot */}
      <div className="absolute -left-[21px] top-2 h-10 w-10 rounded-full bg-white dark:bg-zinc-950 border-2 border-pink-200 dark:border-purple-500/50 flex items-center justify-center text-pink-400 dark:text-purple-400 group-hover:border-pink-400 dark:group-hover:border-purple-400 group-hover:text-pink-500 dark:group-hover:text-purple-300 transition-all shadow-sm">
        <div className="scale-75">{icon}</div>
      </div>
      
      {/* Card */}
      <div className="bg-white dark:bg-zinc-900/90 border border-pink-100 dark:border-purple-500/30 rounded-2xl p-6 hover:shadow-[0_8px_30px_rgba(244,114,182,0.1)] dark:hover:shadow-[0_8px_30px_rgba(168,85,247,0.1)] transition-all shadow-sm duration-300">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-pink-500 dark:text-purple-300 bg-pink-50 dark:bg-purple-900/30 px-2.5 py-1 rounded-full border border-pink-100 dark:border-purple-500/30 transition-colors">
            {nodeId}
          </span>
          <h3 className="text-zinc-800 dark:text-zinc-100 font-bold transition-colors">{title}</h3>
        </div>
        <div className="font-mono text-xs text-pink-600 dark:text-purple-300 bg-pink-50/50 dark:bg-zinc-950 px-4 py-2.5 rounded-xl border border-pink-100/50 dark:border-zinc-800 mb-4 transition-colors">
          {details}
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed transition-colors">{desc}</p>
      </div>
    </div>
  );
}