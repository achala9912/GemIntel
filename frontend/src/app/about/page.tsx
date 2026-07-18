import React from 'react';
import { Gem, Shield, Code, Cpu, Award, GraduationCap } from 'lucide-react';

export default function AboutPage() {
  const models = [
    {
      icon: <Shield className="w-6 h-6 text-rose-400" />,
      title: "AI Authenticity Filter",
      tech: "CNN (EfficientNet-B0/B4) & FFT",
      desc: "Analyzes high-frequency pixel patterns and DCT frequencies to flag AI-generated synthetic images and detect microscopic fake structure anomalies.",
    },
    {
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
      title: "DINOv2 Feature Classifier",
      tech: "Self-Supervised Vision Transformer",
      desc: "Extracts deep semantic embeddings from gemstone facets to classify cut shapes (e.g., Round, Cushion) and extract color coordinates.",
    },
    {
      icon: <Gem className="w-6 h-6 text-cyan-400" />,
      title: "3D Visual Hull Reconstruction",
      tech: "Voxel Back-Projection & Marching Cubes",
      desc: "Processes multi-angle side views to reconstruct the raw crystal's 3D voxel grid. Computes exact volume, bounding box, and yield predictions.",
    },
    {
      icon: <Award className="w-6 h-6 text-blue-400" />,
      title: "Ensemble Price Estimator",
      tech: "XGBoost, LightGBM & Random Forest",
      desc: "Combines physical gem features with macroeconomic indices (like CCPI) to produce robust, live price estimations.",
    },
  ];

  return (
    <>
      {/* Background Decor */}
      <div className="fixed -top-40 -right-40 h-96 w-96 rounded-full bg-purple-600/5 blur-[100px] pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-600/5 blur-[100px] pointer-events-none" />

      <div className="max-width-container pt-4 sm:pt-6 pb-16 sm:pb-20 relative animate-fade-in z-10">

      {/* Header */}
      <header className="text-center mb-12 sm:mb-16">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-500/15 to-cyan-500/15 text-cyan-300 border border-cyan-500/20 mb-5">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>University of Moratuwa Research Project</span>
        </span>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-4">
          About <span className="gradient-text">GemIntel</span>
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-400 leading-relaxed">
          An advanced, multi-modal machine learning suite designed to classify, authenticate, and value gemstones in both raw crystal and finished faceted forms.
        </p>
      </header>

      {/* Scientific Framework Section */}
      <section className="mb-16 sm:mb-20">
        <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-8 uppercase tracking-wider">
          AI Architecture & Models
        </h2>
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {models.map((m, idx) => (
            <div key={idx} className="glass-panel p-6 flex gap-4 items-start border border-white/5 bg-slate-950/20 shadow-lg">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl shrink-0">
                {m.icon}
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white">{m.title}</h3>
                <span className="inline-block text-[10px] sm:text-xs font-semibold text-cyan-400 bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10">
                  {m.tech}
                </span>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed pt-1.5">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team Ozone Section */}
      <section className="max-w-3xl mx-auto text-center glass-panel p-8 sm:p-12 border border-white/5 bg-slate-950/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl text-cyan-400">
            <Code className="w-8 h-8" />
          </div>
        </div>

        <h2 className="text-xl sm:text-3xl font-extrabold text-white mb-3">
          Developed by Team Ozone
        </h2>
        <p className="text-xs sm:text-sm text-cyan-400 font-semibold mb-6 uppercase tracking-wider">
          Department of Computer Science & Engineering
        </p>
        
        <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl mx-auto">
          GemIntel is built as a Final Year Research Project by Team Ozone at the University of Moratuwa. The project focuses on bridging the gap between gemology and computer vision to deliver highly accurate, automated gemstone analytics.
        </p>
      </section>
    </div>
  </>
);
}
