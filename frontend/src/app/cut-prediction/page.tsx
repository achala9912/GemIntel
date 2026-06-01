'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Face {
  indices: number[];
  color: string;
}

interface Edge {
  a: number;
  b: number;
}

const gemstoneOptions = [
  { value: 'Blue Sapphire', label: 'Blue Sapphire', color: 'bg-blue-500', desc: 'Corundum mineral family' },
  { value: 'Spinel', label: 'Spinel', color: 'bg-pink-500', desc: 'Isometric magnesium aluminate' },
  { value: 'Topaz', label: 'Topaz', color: 'bg-yellow-500', desc: 'Silicate mineral of aluminum' },
 
];

export default function CutPrediction() {
  const [gemType, setGemType] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [flash, setFlash] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [showResult, setShowResult] = useState<boolean>(false);

  const [predictedShape, setPredictedShape] = useState<'Round Brilliant' | 'Oval Brilliant' | 'Emerald Cut'>('Round Brilliant');
  const [renderMode, setRenderMode] = useState<'shaded' | 'wireframe' | 'points'>('shaded');
  const [yieldEff, setYieldEff] = useState<number>(68.4);
  const [facets, setFacets] = useState<number>(58);
  const [lightReturn, setLightReturn] = useState<string>('Excellent (9.4/10)');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.6 });
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const remainingSlots = 16 - images.length;
      const filesToProcess = filesArray.slice(0, remainingSlots);

      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === 'string') {
            setImages(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleCameraFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result && typeof reader.result === 'string') {
          setImages(prev => {
            if (prev.length < 16) {
              return [...prev, reader.result as string];
            }
            return prev;
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCapturing(true);
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Could not access camera device directly.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setImages(prev => {
          if (prev.length < 16) {
            return [...prev, dataUrl];
          }
          return prev;
        });
        setFlash(true);
        setTimeout(() => setFlash(false), 200);
      }
    }
  };

  const resetAll = () => {
    setImages([]);
    setGemType('');
    setWeight('');
    setShowResult(false);
    setProgress(0);
    setIsAnalyzing(false);
    stopCamera();
  };

  const startReconstruction = () => {
    if (!gemType || !weight || images.length < 10) return;
    
    setIsAnalyzing(true);
    setProgress(0);

    const messages = [
      'Segmenting profile angles & boundaries...',
      'Aligning image silhouettes for 3D modeling...',
      'Synthesizing rough gemstone boundary shell...',
      'Calculating volumetric center of gravity...',
      'Running optimal facet orientation searches...',
      'Minimizing inclusions / maximizing carat yield...',
      'Generating finished 3D ideal cut profile...'
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 2;
      setProgress(currentProgress);
      const msgIndex = Math.min(Math.floor((currentProgress / 100) * messages.length), messages.length - 1);
      setStatusMsg(messages[msgIndex]);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsAnalyzing(false);
        setShowResult(true);
      }
    }, 80);
  };

  useEffect(() => {
    if (!showResult || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationId: number;
    const getGemGeometry = () => {
      const vertices: Point3D[] = [];
      const faces: Face[] = [];
      const edges: Edge[] = [];
      // (Simplified geometry generator for demo purposes)
      return { vertices, faces, edges };
    };
    const geometry = getGemGeometry();
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [showResult, predictedShape, renderMode, autoRotate]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    rotationRef.current.y += deltaX * 0.007;
    rotationRef.current.x += deltaY * 0.007;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = () => { isDraggingRef.current = false; };
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStartRef.current.x;
    const deltaY = e.touches[0].clientY - dragStartRef.current.y;
    rotationRef.current.y += deltaX * 0.007;
    rotationRef.current.x += deltaY * 0.007;
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 animate-fade-in">
          <Link href="/" className="text-violet-400 hover:text-violet-300 flex items-center gap-2 text-sm font-semibold transition-colors duration-200">
            <span>&larr;</span> Back to Workspace
          </Link>
        </div>

        <header className="text-center mb-10 animate-fade-in">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
            Optimal Cut Prediction & <span className="gradient-text">3D Visualization</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg">
            Reconstruct rough gemstone geometries. Compute optimal facet mapping, yield volume efficiency, and visualize interactive 3D cutting models.
          </p>
        </header>

        {!showResult ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in delay-100">
            <div className="md:col-span-1 flex flex-col gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-5">
                <h2 className="text-lg font-bold flex items-center gap-2 border-b border-white/5 pb-3">
                  <span className="text-violet-400">01</span> Parameters Configuration
                </h2>

                <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gemstone Mineral Type</label>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-slate-900/60 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-violet-500 focus:outline-none transition-all duration-200 flex justify-between items-center text-left"
                  >
                    {gemType ? (
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${gemstoneOptions.find(o => o.value === gemType)?.color}`}></span>
                        <span className="font-medium text-white">{gemType}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Select mineral...</span>
                    )}
                    <svg 
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180 text-violet-400' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-slate-950/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl py-1 animate-fade-in">
                      {gemstoneOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setGemType(opt.value); setIsDropdownOpen(false); }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors duration-150 flex items-center justify-between ${gemType === opt.value ? 'bg-white/[0.03]' : ''}`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2 h-2 rounded-full ${opt.color}`}></span>
                              <span className="font-semibold text-white">{opt.label}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 pl-4.5">{opt.desc}</span>
                          </div>
                          {gemType === opt.value && (
                            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Actual Weight (Carats)</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/10 text-white rounded-xl pl-4 pr-12 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="absolute right-3 px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] uppercase font-bold text-slate-400 select-none pointer-events-none">ct</div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-300">Reconstruction Checklist</h3>
                <div className="flex flex-col gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${gemType ? 'bg-emerald-500' : 'bg-slate-700'}`}></span>
                    <span>Gemstone type specified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${weight ? 'bg-emerald-500' : 'bg-slate-700'}`}></span>
                    <span>Carat weight specified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${images.length >= 10 ? 'bg-emerald-500' : 'bg-slate-700'}`}></span>
                    <span>10–16 side-view images ({images.length}/10 uploaded)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <span className="text-violet-400">02</span> Gemstone Angle Capture
                  </h2>
                </div>

                <div className="flex flex-wrap gap-3 mb-6">
                  <label htmlFor="image-picker" className="btn-secondary flex items-center gap-2 text-sm cursor-pointer py-2.5 bg-white/5 border-white/10 hover:bg-white/10 transition-all">Upload Gallery Images</label>
                  <input id="image-picker" type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />

                  {!isCapturing ? (
                    <button onClick={startCamera} className="btn-secondary flex items-center gap-2 text-sm py-2.5 bg-white/5 border-white/10 hover:bg-white/10 transition-all">Open Live Webcam</button>
                  ) : (
                    <button onClick={stopCamera} className="btn-secondary flex items-center gap-2 text-sm py-2.5 bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20">Close Webcam</button>
                  )}
                </div>

                {isCapturing && (
                  <div className="relative mb-6 rounded-xl overflow-hidden border border-white/15 bg-black flex flex-col items-center">
                    <video ref={videoRef} autoPlay playsInline className="w-full max-w-[480px] aspect-[4/3] object-cover"></video>
                    <div className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_#06b6d4] opacity-70 animate-scan z-10 pointer-events-none"></div>
                    <div className={`absolute inset-0 bg-white pointer-events-none z-20 transition-opacity duration-200 ${flash ? 'opacity-90' : 'opacity-0'}`}></div>
                    <div className="w-full bg-slate-950/90 py-3.5 px-6 flex justify-between items-center border-t border-white/10 z-10">
                      <span className="text-xs text-slate-400">Position the gemstone in center frame</span>
                      <button onClick={capturePhoto} className="bg-violet-600 hover:bg-violet-500 text-white rounded-full p-3 font-semibold transition-all">Capture</button>
                    </div>
                  </div>
                )}
              </div>

              <button
                disabled={!gemType || !weight || images.length < 10}
                onClick={startReconstruction}
                className="w-full btn-primary py-4 text-base font-bold transition-all"
              >
                Compute & Generate 3D Cut Model
              </button>
            </div>
          </div>
        ) : null}

        {isAnalyzing && (
          <div className="glass-panel p-12 rounded-2xl border border-white/10 max-w-lg mx-auto text-center flex flex-col items-center gap-6">
            <span className="spinner w-12 h-12 border-[4px] border-t-violet-500"></span>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold">Reconstructing Gemstone Geometry</h2>
              <p className="text-sm text-slate-400">{statusMsg}</p>
            </div>
            <div className="w-full bg-slate-900 border border-white/5 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-100" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {showResult && !isAnalyzing && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-4">
                <div className="relative w-full aspect-square md:aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-radial-gradient">
                  <canvas ref={canvasRef} width={640} height={480} className="w-full h-full cursor-grab"></canvas>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 flex flex-col gap-5">
              <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-5">
                <h2 className="text-lg font-bold border-b border-white/5 pb-3">Optimal Yield Prediction</h2>
                <div className="text-3xl font-extrabold text-violet-400">
                  {((parseFloat(weight) || 0) * (yieldEff / 100)).toFixed(2)} Carats
                </div>
              </div>
              <button onClick={resetAll} className="btn-secondary py-3 text-sm font-semibold w-full rounded-xl">Scan Another Gemstone</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
