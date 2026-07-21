'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gem, Shield, Search, Coins, Layers, Eye } from 'lucide-react';
import CutPredictionPage from '@/app/cut-prediction/page';

export default function Home() {
  const router = useRouter();
  const [activePortal, setActivePortal] = useState<'home' | 'rough'>('home');

  useEffect(() => {
    // Make sure we clear any stale flow state when arriving back on the main landing page
    if (activePortal === 'home') {
      sessionStorage.removeItem('faceted_flow_active');
      sessionStorage.removeItem('faceted_flow_step');
    }
  }, [activePortal]);

  const handleStartFacetedFlow = () => {
    sessionStorage.setItem('faceted_flow_active', 'true');
    sessionStorage.setItem('faceted_flow_step', '1');
    sessionStorage.removeItem('faceted_flow_image');
    sessionStorage.removeItem('faceted_flow_image_name');
    sessionStorage.removeItem('faceted_flow_auth_result');
    sessionStorage.removeItem('faceted_flow_identify_result');
    router.push('/authentication');
  };

  if (activePortal === 'rough') {
    return (
      <div className="w-full animate-fade-in">
        <CutPredictionPage onBack={() => setActivePortal('home')} />
      </div>
    );
  }

  return (
    <div className="max-width-container pt-8 sm:pt-12 pb-16 sm:pb-20 relative animate-fade-in">
      {/* Hero Section */}
      <section className="mb-16 sm:mb-24 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-slate-950/60 text-cyan-400 border border-slate-800/80 mb-6 backdrop-blur-md shadow-lg">
          <Gem className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next-Generation Gemstone Analytics</span>
        </span>
        <h1 
          className="mb-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white w-full text-center"
          style={{ textAlign: 'center' }}
        >
          True Value Estimation &
          <br />
          <span className="gradient-text">
            AI Authentication
          </span>
        </h1>
        <p 
          className="mx-auto mb-10 max-w-2xl text-sm sm:text-base text-gray-400 leading-relaxed font-normal text-center"
          style={{ textAlign: 'center' }}
        >
          GemIntel uses state-of-the-art DINOv2 vision models, 3D visual hull reconstruction, 
          and ensemble ML regression to classify, authenticate, and value raw and finished gemstones.
        </p>
      </section>

      {/* Main Focus: 2 Gem Categories Split Portal */}
      <section className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-extrabold mb-3">
            Select Gemstone Category
          </h2>
          <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
            Our system is tailored for two distinct states of gemstone lifecycle. 
            Choose the category to unlock appropriate analytics models.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Rough Gems Panel */}
          <div 
            onClick={() => setActivePortal('rough')}
            className="group p-8 flex flex-col justify-between items-start transition-all hover:-translate-y-1.5 duration-300 border border-slate-800/80 hover:border-cyan-500/30 rounded-2xl relative overflow-hidden bg-slate-950/40 hover:bg-slate-950/70 cursor-pointer shadow-2xl shadow-black/80"
          >
            {/* Subtle top indicator bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 group-hover:from-cyan-500/40 group-hover:to-teal-500/40 transition-all duration-300" />
            
            <div className="w-full">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform duration-300 shadow-lg">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                Rough Gems Portal
              </h3>
              <p className="text-xs leading-relaxed text-gray-400 mb-8 min-h-[64px]">
                Designed for uncut, raw gemstone crystals. Perform 3D visual hull reconstruction from multi-angle snapshots, calculate volume metrics, and predict the optimal cutting configuration and raw yield percentage.
              </p>
              
              <div className="space-y-3 mb-8 border-t border-slate-900 pt-6">
                <div className="flex items-center gap-2.5 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]" />
                  <span>3D Voxel Hull Visualizer</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]" />
                  <span>Optimal Cut Predictions</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]" />
                  <span>Carat Yield Estimation</span>
                </div>
              </div>
            </div>

            <button className="w-full py-3.5 rounded-xl text-xs font-bold tracking-wider uppercase text-white shadow-lg transition-all duration-300 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #0d9488)' }}
            >
              Analyze Rough Gem →
            </button>
          </div>

          {/* Faceted Gems Panel */}
          <div 
            onClick={handleStartFacetedFlow}
            className="group p-8 flex flex-col justify-between items-start transition-all hover:-translate-y-1.5 duration-300 border border-slate-800/80 hover:border-blue-500/30 rounded-2xl relative overflow-hidden bg-slate-950/40 hover:bg-slate-950/70 cursor-pointer shadow-2xl shadow-black/80"
          >
            {/* Subtle top indicator bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 group-hover:from-blue-500/40 group-hover:to-indigo-500/40 transition-all duration-300" />

            <div className="w-full">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform duration-300 shadow-lg">
                <Gem className="w-5 h-5" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                Faceted Gems Portal
              </h3>
              <p className="text-xs leading-relaxed text-gray-400 mb-8 min-h-[64px]">
                Designed for finished, cut gemstones. Start the multi-stage pipeline: authenticate microscopic features to detect lab-synthetics, execute DINOv2 color and shape classifiers, and estimate pricing based on live economic factors.
              </p>

              <div className="space-y-3 mb-8 border-t border-slate-900 pt-6">
                <div className="flex items-center gap-2.5 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                  <span>AI Generated & Synthetic Check</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                  <span>DINOv2 Shape & Hue Extraction</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                  <span>CCPI-Adjusted Value Estimator</span>
                </div>
              </div>
            </div>

            <button 
              className="w-full py-3.5 rounded-xl text-xs font-bold tracking-wider uppercase text-white shadow-lg transition-all duration-300 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)' }}
            >
              Start Guided Pipeline →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}