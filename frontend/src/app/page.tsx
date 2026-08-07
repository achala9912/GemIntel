'use client';

import { useState, useEffect } from 'react';;
import { useRouter } from 'next/navigation';
import { Gem, Layers } from 'lucide-react';
import CutPredictionPage from '@/app/cut-prediction/page';
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [activePortal, setActivePortal] = useState<'home' | 'rough'>('home');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPortal = sessionStorage.getItem('active_portal') as 'home' | 'rough';
      setTimeout(() => {
        if (savedPortal) {
          setActivePortal(savedPortal);
        }
        setIsInitialized(true);
      }, 0);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('active_portal', activePortal);
    }
    // Make sure we clear any stale flow state when arriving back on the main landing page
    if (activePortal === 'home') {
      sessionStorage.removeItem('faceted_flow_active');
      sessionStorage.removeItem('faceted_flow_step');
      sessionStorage.removeItem('rough_flow_cut_result');
      sessionStorage.removeItem('rough_flow_gem_type');
      sessionStorage.removeItem('rough_flow_weight');
    }
  }, [activePortal, isInitialized]);

  const handleStartFacetedFlow = () => {
    sessionStorage.setItem('faceted_flow_active', 'true');
    sessionStorage.setItem('faceted_flow_step', '1');
    sessionStorage.removeItem('faceted_flow_image');
    sessionStorage.removeItem('faceted_flow_image_name');
    sessionStorage.removeItem('faceted_flow_auth_result');
    sessionStorage.removeItem('faceted_flow_identify_result');
    sessionStorage.removeItem('faceted_flow_carat_result');
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
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs tracking-wide font-semibold bg-slate-900 text-blue-400 border border-slate-800 mb-6 shadow-sm">
          <Gem className="w-4 h-4 text-blue-400" />
          <span>ML-Driven Gemstone Analytics Platform</span>
        </span>
        <h1
          className="mb-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white w-full text-center"
          style={{ textAlign: 'center' }}
        >
          Authentication, 4C&apos;s Identification, Valuation
          <br />
          <span className="text-blue-400">
            & Cut Prediction
          </span>
        </h1>
        <p
          className="mx-auto mb-10 max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed font-normal text-center"
          style={{ textAlign: 'center' }}
        >
          GemIntel uses state-of-the-art vision transformer models, transfer learning models, 3D visual hull reconstruction,
          and ensemble ML regression to classify, authenticate, and evaluate faceted gemstones and rough gemstones.
        </p>
      </section>

      {/* Main Focus: 2 Gem Categories Split Portal */}
      <section className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3">
            Select Gemstone Category
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Our system is tailored for two distinct states of gemstone lifecycle.
            Choose the category to unlock appropriate analytics models.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Rough Gems Panel */}
          <div
            onClick={() => setActivePortal('rough')}
            className="group p-8 flex flex-col justify-between items-start transition-all duration-200 border border-slate-800 hover:border-slate-700 rounded-2xl relative overflow-hidden bg-slate-900/90 hover:bg-slate-900 cursor-pointer shadow-lg"
          >
            <div className="w-full">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-950/60 border border-blue-800/40 text-blue-400 group-hover:bg-blue-900/60 transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                Portal for Rough Gems
              </h3>
              <p className="text-xs leading-relaxed text-slate-400 mb-8 min-h-[64px]">
                Designed for uncut, raw gemstone crystals. Perform 3D visual hull reconstruction from multi-angle snapshots, calculate volume metrics, and predict the optimal cutting configuration and raw yield percentage.
              </p>

              <div className="space-y-3 mb-8 border-t border-slate-800/80 pt-6">
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>3D Visual Hull Reconstruction</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Optimal Cut Prediction</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Carat Yield Estimation</span>
                </div>
              </div>
            </div>

            <button className="btn-primary w-full py-3.5 text-xs tracking-wider uppercase">
              Analyze Rough Gems →
            </button>
          </div>

          {/* Faceted Gems Panel */}
          <div
            onClick={handleStartFacetedFlow}
            className="group p-8 flex flex-col justify-between items-start transition-all duration-200 border border-slate-800 hover:border-blue-600/50 rounded-2xl relative overflow-hidden bg-slate-900/90 hover:bg-slate-900 cursor-pointer shadow-lg"
          >
            <div className="w-full">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 group-hover:bg-blue-600/20 transition-colors">
                <Gem className="w-5 h-5" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                Portal for Faceted Gems
              </h3>
              <p className="text-xs leading-relaxed text-slate-400 mb-8 min-h-[64px]">
                Designed for finished, cut gemstones. Start the multi-stage pipeline: authenticate microscopic features to detect lab-synthetics, execute DINOv2 color and shape classifiers, and estimate pricing based on live economic factors.
              </p>

              <div className="space-y-3 mb-8 border-t border-slate-800/80 pt-6">
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Gemstone Authentication - Natural / Synthetic</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Color, Cut, Carat, Shape, Clarity & Hue Extraction</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Market-Oriented Value Estimation</span>
                </div>
              </div>
            </div>

            <button className="btn-primary w-full py-3.5 text-xs tracking-wider uppercase">
              Analyze Faceted Gems →
            </button>
          </div>
        </div>

        {/* Direct shortcut: skip the guided auth flow, go straight to Feature Identification */}
        <div className="text-center mt-6">
          <Link
            href="/four-c"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-purple-300 transition-colors"
          >
            Skip authentication — go straight to Feature Identification →
          </Link>
        </div>
      </section>
    </div>
  );
}