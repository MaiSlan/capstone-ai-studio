'use client';

import React, { useState, useRef, useEffect } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { Eraser, UploadCloud, Sparkles, Download, X, Loader2, ImagePlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function BackgroundRemover() {
  const router = useRouter();
  const supabase = createClient();

  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Instant Route Guard (Locking the tool to signed-in users)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.replace('/auth');
        return;
      }
      setIsAuthenticating(false);
    };
    checkAuth();
  }, [router, supabase]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [previewUrl, resultUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG).');
      return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setError(null);
  };

  const handleRemoveBackground = async () => {
    if (!imageFile) return;
    setIsProcessing(true);
    setError(null);

    try {
      // 2. UPGRADED AI CONFIGURATION
      // We force the engine to use the "medium" model (or "large") for much better edge 
      // detection on flat anime/chibi colors, rather than the default "small" model.
      const config = {
        model: "medium", // You can change this to "large" if you want even better quality!
        output: {
          format: "image/png",
          quality: 1.0
        }
      };

      const imageBlob = await removeBackground(imageFile, config as any);
      const url = URL.createObjectURL(imageBlob);
      setResultUrl(url);
    } catch (err) {
      console.error(err);
      setError("The AI encountered an issue removing the background. Try another image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setPreviewUrl(null);
    setResultUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `flufforia-transparent-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const checkerboardBg = {
    backgroundImage: `
      linear-gradient(45deg, rgba(128,128,128,0.1) 25%, transparent 25%), 
      linear-gradient(-45deg, rgba(128,128,128,0.1) 25%, transparent 25%), 
      linear-gradient(45deg, transparent 75%, rgba(128,128,128,0.1) 75%), 
      linear-gradient(-45deg, transparent 75%, rgba(128,128,128,0.1) 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
  };

  // Prevent UI flash while verifying user
  if (isAuthenticating) {
    return <div className="min-h-screen bg-[#FFFAF0] dark:bg-zinc-950 transition-colors duration-700"></div>;
  }

  return (
    <div className="min-h-screen pt-32 pb-20 bg-[#FFFAF0] dark:bg-zinc-950 transition-colors duration-700 flex flex-col items-center p-6 bg-[repeating-linear-gradient(to_right,transparent,transparent_40px,rgba(251,113,133,0.03)_40px,rgba(251,113,133,0.03)_80px)] dark:bg-[linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b),linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b)] dark:bg-[length:20px_20px] dark:bg-[position:0_0,10px_10px]">
      
      <div className="text-center mb-10 animate-fade-in">
        <div className="mx-auto h-16 w-16 rounded-full bg-pink-100 dark:bg-purple-900/50 text-pink-500 dark:text-purple-400 flex items-center justify-center mb-4 shadow-sm transform -rotate-3 transition-colors">
          <Eraser size={32} />
        </div>
        <h1 className="text-4xl font-bold text-zinc-800 dark:text-zinc-100 mb-2 transition-colors" style={{ fontFamily: '"Fredoka", sans-serif' }}>
          Magic Eraser
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto transition-colors">
          Instantly remove backgrounds from your generated assets. Runs 100% locally in your browser for total privacy.
        </p>
      </div>

      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900/90 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(168,85,247,0.05)] border border-pink-100 dark:border-purple-500/30 overflow-hidden transition-all duration-700">
        
        <div className="p-8 md:p-10">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-500 dark:text-red-400 rounded-2xl text-sm font-medium transition-colors">
              {error}
            </div>
          )}

          {!previewUrl ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-80 border-2 border-dashed border-pink-200 dark:border-purple-500/30 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-pink-50 dark:hover:bg-purple-900/10 transition-colors group"
            >
              <div className="h-16 w-16 rounded-full bg-pink-100 dark:bg-zinc-800 text-pink-400 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-200 mb-1" style={{ fontFamily: '"Fredoka", sans-serif' }}>Drop your asset here</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">or click to browse from your device</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="relative w-full aspect-square md:aspect-video rounded-3xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950" style={checkerboardBg}>
                
                <img 
                  src={resultUrl || previewUrl} 
                  alt="Asset Preview" 
                  className={`w-full h-full object-contain transition-opacity duration-500 ${isProcessing ? 'opacity-30 blur-sm' : 'opacity-100'}`}
                />

                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-pink-500 dark:text-purple-400">
                    <Loader2 size={48} className="animate-spin mb-4" />
                    <span className="font-bold bg-white/80 dark:bg-zinc-900/80 px-4 py-2 rounded-full backdrop-blur-sm text-sm">
                      Extracting Asset...
                    </span>
                  </div>
                )}

                <button 
                  onClick={clearImage}
                  disabled={isProcessing}
                  className="absolute top-4 right-4 h-10 w-10 bg-white/90 dark:bg-zinc-900/90 text-zinc-500 hover:text-red-500 rounded-full flex items-center justify-center shadow-lg backdrop-blur disabled:opacity-50 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex gap-4">
                {!resultUrl ? (
                  <button 
                    onClick={handleRemoveBackground}
                    disabled={isProcessing}
                    className="flex-1 bg-pink-400 dark:bg-purple-600 hover:bg-pink-500 dark:hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_0_rgba(244,114,182,0.4)] dark:shadow-[0_4px_0_rgba(147,51,234,0.4)] hover:translate-y-[2px]"
                  >
                    {isProcessing ? 'Working...' : 'Remove Background'}
                    {!isProcessing && <Sparkles size={18} />}
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={clearImage}
                      className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
                    >
                      <ImagePlus size={18} /> Process Another
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="flex-1 bg-pink-400 dark:bg-purple-600 hover:bg-pink-500 dark:hover:bg-purple-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_0_rgba(244,114,182,0.4)] dark:shadow-[0_4px_0_rgba(147,51,234,0.4)] hover:translate-y-[2px]"
                    >
                      <Download size={18} /> Save Asset
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/png, image/jpeg" 
            className="hidden" 
          />
        </div>
      </div>
    </div>
  );
}