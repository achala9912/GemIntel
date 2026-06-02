"use client";

import { useState, useRef, useEffect } from "react";
import type { ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import GemViewer3D from "@/components/GemViewer3D";


import {
  uploadGemImages,
  startProcessingPipeline,
  checkPipelineStatus,
  getPredictionResult,
  cancelProcessingPipeline,
} from "@/services/cutApi";
import type { PredictionResult, PipelineStatus } from "@/services/cutApi";

const MIN_IMAGES = 8;
const MAX_IMAGES = 16;
const GEM_TYPES = [
  { value: "blue_sapphire", label: "Blue Sapphire", dotColor: "#3b82f6"  },
  { value: "spinel",        label: "Spinel",        dotColor: "#ec4899" },
  { value: "topaz",         label: "Topaz",         dotColor: "#eab308" },
];

interface ImageFile {
  file: File;
  previewUrl: string;
}

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

interface StepIconProps {
  state: "pending" | "active" | "completed" | "error";
  type: "upload" | "mask" | "reconstruct" | "predict" | "preview";
}

const StepIcon = ({ state, type }: StepIconProps) => {
  if (state === "completed") {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 scale-100 transition-all duration-300 shrink-0">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse shrink-0">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  if (state === "pending") {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white/10 text-white/20 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
      </div>
    );
  }

  switch (type) {
    case "upload":
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.2)] shrink-0">
          <svg className="w-3.5 h-3.5 animate-[bounce_1s_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
      );
    case "mask":
      return (
        <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.2)] overflow-hidden shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="absolute inset-x-0 h-[1.5px] bg-purple-400 shadow-[0_0_4px_#c084fc] top-0 animate-scan" />
        </div>
      );
    case "reconstruct":
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)] shrink-0">
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      );
    case "predict":
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 shadow-[0_0_12px_rgba(236,72,153,0.2)] shrink-0">
          <svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      );
    case "preview":
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)] shrink-0">
          <svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      );
    default:
      return null;
  }
};

export default function CutPredictionPage() {
  const [gemType, setGemType] = useState<string>("");
  const [weight, setWeight] = useState<number>(0);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [session, setSession] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<number | null>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<ImageFile[]>([]);

  // Webcam states
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [flash, setFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    const ua = navigator.userAgent || "";
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const isScreenSize = window.matchMedia("(max-width: 1024px)").matches;
    const isUAMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    const isMobileDevice = isTouch && (isScreenSize || isUAMobile);

    if (!isMobileDevice) {
      toast("Live camera capture is only available on mobile or tablet devices.", { icon: "ℹ️" });
      return;
    }

    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      
      const constraints: MediaStreamConstraints = {
        video: { facingMode: "environment" }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsCapturing(true);
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Could not access camera. Please check permissions or upload photos.");
    }
  };

  useEffect(() => {
    if (isCapturing && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCapturing, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        const file = dataURLtoFile(dataUrl, `captured_${Date.now()}.jpg`);
        
        setImages((prev) => {
          if (prev.length >= MAX_IMAGES) {
            toast(`Maximum limit of ${MAX_IMAGES} images reached.`, { icon: "ℹ️" });
            return prev;
          }
          return [...prev, { file, previewUrl: dataUrl }];
        });

        setFlash(true);
        setTimeout(() => setFlash(false), 150);
        toast.success("Snapshot captured successfully!");
      }
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter((f) =>
      ["image/png", "image/jpeg", "image/webp"].includes(f.type)
    );

    const newImages = validFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => {
      const combined = [...prev, ...newImages];
      const sliceLimit = MAX_IMAGES;

      if (combined.length > sliceLimit) {
        // Revoke URLs of images that exceed the maximum count limit
        combined.slice(sliceLimit).forEach((img) => URL.revokeObjectURL(img.previewUrl));
        return combined.slice(0, sliceLimit);
      }

      return combined;
    });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (previewUrl: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.previewUrl === previewUrl);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((img) => img.previewUrl !== previewUrl);
    });
  };

  const checklistItems = [
    {
      label: "Gemstone type specified",
      done: Boolean(gemType),
    },
    {
      label: "Carat weight specified",
      done: weight > 0,
    },
    {
      label: `${MIN_IMAGES}–${MAX_IMAGES} side-view images`,
      done: images.length >= MIN_IMAGES,
      detail: `${images.length}/${MIN_IMAGES} required (${images.length} uploaded)`,
    },
  ];
  const canSubmit = checklistItems.every((c) => c.done) && status === "idle";

  // ---- Pipeline Action ----
  const runPipeline = async () => {
    setError(null);
    setResult(null);
    setStatus("uploading");
    setFailedStep(null);

    try {
      // 1. Upload
      const session_id = await uploadGemImages(
        gemType,
        weight,
        images.map((img) => img.file)
      );
      setSession(session_id);

      // 2. Start processing
      setStatus("processing");
      await startProcessingPipeline(session_id);

      // 3. Poll status
      const pollInterval = 1500;
      const maxWait = 120_000; 
      const startedAt = Date.now();

      while (Date.now() - startedAt < maxWait) {
        await new Promise((r) => setTimeout(r, pollInterval));
        const sData = await checkPipelineStatus(session_id);

        if (sData.status === "idle") {
          toast("Processing stopped by user.", { icon: "🛑" });
          setStatus("idle");
          setSession(null);
          return;
        }

        setStatus(sData.status);

        if (sData.status === "done") {
          // 4. Fetch result
          const rData = await getPredictionResult(session_id);
          setResult(rData);
          return;
        }
        if (sData.status === "error") {
          throw new Error(sData.error || "Pipeline failed");
        }
      }
      throw new Error("Timed out after 2 minutes");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
      
      setStatus((currentStatus) => {
        let failedStepIndex = 1;
        if (currentStatus === "uploading") failedStepIndex = 1;
        else if (currentStatus === "processing" || currentStatus === "generating_masks") failedStepIndex = 2;
        else if (currentStatus === "reconstructing") failedStepIndex = 3;
        else if (currentStatus === "predicting") failedStepIndex = 4;
        else failedStepIndex = 2;
        setFailedStep(failedStepIndex);
        return "error";
      });

      toast.error(`Pipeline Failed: ${errMsg}`);
    }
  };

  const handleStop = async () => {
    if (!session) return;
    try {
      setStatus("idle");
      setFailedStep(null);
      await cancelProcessingPipeline(session);
      setSession(null);
    } catch (err) {
      console.error("Error stopping pipeline:", err);
      toast.error("Failed to cancel processing pipeline on server.");
    }
  };

  const reset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setGemType("");
    setWeight(0);
    setSession(null);
    setResult(null);
    setError(null);
    setStatus("idle");
    setFailedStep(null);
    stopCamera();
  };

  // ---- Status Display Labels ----
  const statusLabel: Record<PipelineStatus, string> = {
    idle: "Ready",
    uploading: "Uploading images...",
    uploaded: "Images received",
    processing: "Starting...",
    generating_masks: "Removing backgrounds...",
    reconstructing: "Building 3D digital twin...",
    predicting: "AI predicting optimal cut...",
    done: "Complete",
    error: "Error",
  };
  const isProcessing = !["idle", "done", "error"].includes(status);
  const showPipelineHUD = status !== "idle";

  const getStepStatus = (stepIndex: number): "pending" | "active" | "completed" | "error" => {
    if (status === "idle") return "pending";
    
    if (status === "error") {
      if (failedStep === stepIndex) return "error";
      return failedStep !== null && failedStep > stepIndex ? "completed" : "pending";
    }
    
    switch (stepIndex) {
      case 1:
        if (status === "uploading") return "active";
        return "completed";
      case 2:
        if (["uploading"].includes(status)) return "pending";
        if (["processing", "generating_masks"].includes(status)) return "active";
        return "completed";
      case 3:
        if (["uploading", "processing", "generating_masks"].includes(status)) return "pending";
        if (status === "reconstructing") return "active";
        return "completed";
      case 4:
        if (["uploading", "processing", "generating_masks", "reconstructing"].includes(status)) return "pending";
        if (status === "predicting") return "active";
        return "completed";
      case 5:
        if (status === "done") return "completed";
        return "pending";
      default:
        return "pending";
    }
  };

  return (
    <div className="min-h-screen text-white">
      {result && (
        <div className="fixed inset-0 z-50 bg-[#0a0c1a]">
          <GemViewer3D data={result} onClose={reset} />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
    

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-center mb-2 leading-tight px-2">
          Gem Cut Prediction &{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            3D Visualizer
          </span>
        </h1>
        <p className="text-center text-sm sm:text-base opacity-60 mb-8 sm:mb-12 px-4">
          Let&apos;s find optimal cut shape and material yield.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* ===== Parameters Card ===== */}
          <div className="bg-[rgba(255,255,255,0.04)] border border-white/10 rounded-2xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-medium mb-4 sm:mb-5">
              <span className="opacity-50 mr-2">01</span> Parameters Config
            </h2>

            <div className="relative mb-5" ref={dropdownRef}>
              <label className="block text-xs uppercase tracking-wide opacity-50 mt-2 mb-3 sm:my-4">
                Gemstone type
              </label>
              
              <button
                type="button"
                onClick={() => !isProcessing && setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full bg-[rgba(0,0,0,0.4)] border border-white/10 rounded-xl px-4 py-3.5 text-sm flex justify-between items-center text-left transition ${
                  isProcessing ? "opacity-50 cursor-not-allowed" : "hover:bg-white/[0.02] active:scale-[0.99] cursor-pointer"
                }`}
                disabled={isProcessing}
              >
                {gemType ? (
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] shrink-0" 
                      style={{ 
                        backgroundColor: GEM_TYPES.find(g => g.value === gemType)?.dotColor,
                        color: GEM_TYPES.find(g => g.value === gemType)?.dotColor 
                      }} 
                    />
                    <span className="font-semibold text-white truncate">
                      {GEM_TYPES.find((g) => g.value === gemType)?.label}
                    </span>
                  </div>
                ) : (
                  <span className="text-white/40 font-medium truncate">Select type...</span>
                )}
                
                <svg
                  className={`w-4 h-4 text-white/50 transition-transform duration-200 shrink-0 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-[#0a0c1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1.5 animate-fade-in">
                  {GEM_TYPES.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => {
                        setGemType(g.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-white/5 transition flex items-center justify-between group cursor-pointer ${
                        gemType === g.value ? "bg-white/[0.03]" : ""
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span 
                            className="w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-110 shrink-0" 
                            style={{ backgroundColor: g.dotColor }}
                          />
                          <span className="font-semibold text-white text-sm truncate">{g.label}</span>
                        </div>

                      </div>
                      
                      {gemType === g.value && (
                        <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label className="block text-xs uppercase tracking-wide opacity-50 mb-2">
              Actual weight (carats)
            </label>
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setWeight((w) => Math.max(0, +(w - 0.1).toFixed(2)))}
                className="w-10 h-10 shrink-0 rounded-lg border border-white/10 hover:bg-white/5 active:scale-95 transition"
                disabled={isProcessing}
              >
                −
              </button>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                className="flex-1 min-w-0 text-center bg-[rgba(0,0,0,0.4)] border border-white/10 rounded-lg px-3 py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                disabled={isProcessing}
              />
              <span className="text-xs opacity-50 px-2 py-1 border border-white/10 rounded shrink-0">ct</span>
              <button
                onClick={() => setWeight((w) => +(w + 0.1).toFixed(2))}
                className="w-10 h-10 shrink-0 rounded-lg border border-white/10 hover:bg-white/5 active:scale-95 transition"
                disabled={isProcessing}
              >
                +
              </button>
            </div>

            {/* Checklist */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Reconstruction Checklist</span>
              </h3>
              {checklistItems.map((c, i) => (
                <div key={i} className="flex justify-between items-start py-2.5 text-sm border-b border-white/[0.02] last:border-0 gap-3">
                  <span className="flex items-start gap-2 min-w-0">
                    {c.done ? (
                      <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-yellow-500/40 bg-yellow-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                      </div>
                    )}
                    <span className={`leading-snug break-words ${c.done ? "text-white/80" : "text-white/40"}`}>{c.label}</span>
                  </span>
                  <span className={`text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded shrink-0 mt-0.5 text-right ${
                    c.done ? "text-emerald-400 bg-emerald-500/5" : "text-yellow-400 bg-yellow-500/5"
                  }`}>
                    {c.detail || (c.done ? "Done" : "Pending")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ===== Image Upload Card ===== */}
          <div className="bg-[rgba(255,255,255,0.04)] border border-white/10 rounded-2xl p-4 sm:p-6">
            <div className="flex justify-between items-center gap-2 mb-4 sm:mb-5">
              <h2 className="text-base sm:text-lg font-medium">
                <span className="opacity-50 mr-2">02</span> Angle Image Capture
              </h2>
              <span className="text-xs opacity-50 shrink-0 text-right">
                {MIN_IMAGES} to {MAX_IMAGES} pictures
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <button
                type="button"
                className={`flex-1 rounded-lg py-2.5 sm:py-2 text-sm transition ${
                  !isCapturing
                    ? "bg-blue-500/15 border border-blue-500/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                    : "border border-white/10 text-white/60"
                }`}
                disabled={isProcessing}
              >
                ⬆ Upload Angle Photos
              </button>
              <button
                onClick={isCapturing ? stopCamera : startCamera}
                className={`flex-1 border rounded-lg py-2.5 sm:py-2 text-sm cursor-pointer active:scale-[0.99] transition ${
                  isCapturing 
                    ? "bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30" 
                    : "border-white/10 hover:bg-white/5"
                }`}
                disabled={isProcessing}
              >
                {isCapturing ? "📷 Close Camera" : "📷 Open Live Camera"}
              </button>
            </div>

            {/* Live Camera View */}
            {isCapturing && (
              <div className="relative aspect-square sm:aspect-video bg-black rounded-xl overflow-hidden mb-4 border border-white/10 flex flex-col items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Visual Alignment Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="relative w-32 h-32 sm:w-44 sm:h-44 flex items-center justify-center animate-pulse">
                    <svg
                      className="w-full h-full text-blue-500/40 filter drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                      viewBox="0 0 100 100"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      {/* Outer Gem Polygon */}
                      <polygon points="50,10 85,25 90,65 50,90 10,65 15,25" />
                      {/* Inner Facet Guide Lines */}
                      <line x1="50" y1="10" x2="50" y2="90" />
                      <line x1="15" y1="25" x2="85" y2="25" />
                      <line x1="10" y1="65" x2="90" y2="65" />
                      <line x1="15" y1="25" x2="50" y2="40" />
                      <line x1="85" y1="25" x2="50" y2="40" />
                      <line x1="10" y1="65" x2="50" y2="40" />
                      <line x1="90" y1="65" x2="50" y2="40" />
                    </svg>

                    {/* Bounding Box Corner Marks */}
                    <div className="absolute -top-2 -left-2 w-5 h-5 border-t-2 border-l-2 border-blue-400 rounded-tl" />
                    <div className="absolute -top-2 -right-2 w-5 h-5 border-t-2 border-r-2 border-blue-400 rounded-tr" />
                    <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b-2 border-l-2 border-blue-400 rounded-bl" />
                    <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b-2 border-r-2 border-blue-400 rounded-br" />
                  </div>
                  
                  {/* Bounding Helper Label */}
                  <span className="mt-3 text-[9px] sm:text-[10px] font-mono tracking-widest text-blue-400/80 bg-black/60 px-2.5 py-0.5 rounded-full uppercase border border-blue-500/10 backdrop-blur-sm">
                    Align Gem Within Frame
                  </span>
                </div>
                
                {/* Flash overlay */}
                {flash && <div className="absolute inset-0 bg-white pointer-events-none z-20 animate-fade-out" />}
                
                <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 z-10 flex flex-row justify-center items-center gap-3 px-4">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-4 py-2 font-semibold text-xs shadow-lg flex items-center gap-1 cursor-pointer transition active:scale-95"
                  >
                    📸 Take Photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full px-4 py-2 font-semibold text-xs cursor-pointer transition active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Live captured thumbnails (visible while camera is open) */}
            {isCapturing && images.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs opacity-50">Captured</span>
                  <span className="text-xs opacity-50">{images.length}/{MAX_IMAGES}</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {images.map((img, i) => (
                    <div
                      key={img.previewUrl}
                      className="relative aspect-square bg-black/40 rounded-md overflow-hidden border border-white/10"
                    >
                      <Image
                        src={img.previewUrl}
                        alt={`capture ${i}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img.previewUrl)}
                        className="absolute top-1 right-1 bg-black/70 rounded-full w-5 h-5 text-xs z-10 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
              className="hidden"
            />

            {!isCapturing && (
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-white/15 rounded-xl p-5 sm:p-8 text-center hover:border-white/30 transition cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {images.length === 0 ? (
                <>
                  <div className="text-4xl opacity-30 mb-2">+</div>
                  <div className="font-medium text-sm sm:text-base">Drag and drop files here</div>
                  <div className="text-xs opacity-50 mt-2 max-w-sm mx-auto">
                    Upload between {MIN_IMAGES} to {MAX_IMAGES} high-definition side-angle
                    gemstone snapshots to perform visual hull calculations.
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {images.map((img, i) => (
                    <div
                      key={img.previewUrl}
                      className="relative aspect-square bg-black/40 rounded-md overflow-hidden"
                    >
                      <Image
                        src={img.previewUrl}
                        alt={`upload ${i}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(img.previewUrl);
                        }}
                        className="absolute top-1 right-1 bg-black/70 rounded-full w-5 h-5 text-xs z-10 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Pipeline Progress HUD */}
        {showPipelineHUD && (
          <div className="mt-4 sm:mt-6 bg-white/[0.02] border border-white/5 rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-2xl animate-fade-in">
            {/* Glowing top line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${
              status === "error" 
                ? "from-rose-500 via-red-500 to-amber-500" 
                : status === "done" 
                ? "from-emerald-500 via-teal-500 to-cyan-500"
                : "from-blue-500 via-purple-500 to-cyan-500 animate-pulse"
            }`} />

            <h3 className="text-xs font-semibold uppercase tracking-widest pb-4 mb-3 border-b border-white/5 flex items-center gap-2">
              {status === "error" ? (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
              ) : status === "done" ? (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              ) : (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
              )}
              <span className={status === "error" ? "text-rose-400" : status === "done" ? "text-emerald-400" : "text-blue-400"}>
                {status === "error" 
                  ? "Visual Hull Reconstruction Failed" 
                  : status === "done" 
                  ? "Visual Hull Reconstruction Complete" 
                  : "Visual Hull Reconstruction Pipeline"}
              </span>
            </h3>

            <div className="flex flex-col divide-y divide-white/5">
              {[
                {
                  id: 1,
                  type: "upload" as const,
                  label: "Uploading side-view snaps...",
                  activeLabel: "Uploading side-view snaps...",
                  completedLabel: "Side-view snaps uploaded",
                },
                {
                  id: 2,
                  type: "mask" as const,
                  label: "Removing backgrounds & creating masks...",
                  activeLabel: "Removing backgrounds & creating masks...",
                  completedLabel: "Backgrounds removed & masks created",
                },
                {
                  id: 3,
                  type: "reconstruct" as const,
                  label: "Reconstructing 3D digital twin...",
                  activeLabel: "Reconstructing 3D digital twin...",
                  completedLabel: "3D digital twin reconstructed",
                },
                {
                  id: 4,
                  type: "predict" as const,
                  label: "Predicting optimal cut shape & yield estimation...",
                  activeLabel: "Predicting optimal cut shape & yield estimation...",
                  completedLabel: "Optimal cut shape & yield estimated",
                },
                {
                  id: 5,
                  type: "preview" as const,
                  label: "Previewing live 3D cut...",
                  activeLabel: "Generating live 3D cut preview...",
                  completedLabel: "Live 3D cut ready",
                },
              ].map((step) => {
                const stepState = getStepStatus(step.id);
                const isStepActive = stepState === "active";
                const isStepCompleted = stepState === "completed";
                const isStepError = stepState === "error";

                let textClass = "text-white/20";
                let statusLabelText = "Pending";

                if (isStepActive) {
                  textClass = "text-blue-400 font-semibold drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]";
                  statusLabelText = "Active";
                } else if (isStepCompleted) {
                  textClass = "text-white/70";
                  statusLabelText = "Completed";
                } else if (isStepError) {
                  textClass = "text-rose-400 font-semibold";
                  statusLabelText = "Failed";
                }

                return (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between gap-2 py-3 sm:py-3.5 transition-all duration-300 ${
                      isStepActive ? "bg-white/[0.01] -mx-2 px-2 rounded-lg" : ""
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <StepIcon state={stepState} type={step.type} />
                      <span className={`text-[10px] sm:text-xs transition-colors duration-300 break-words ${textClass}`}>
                        {isStepCompleted ? step.completedLabel : isStepActive ? step.activeLabel : step.label}
                      </span>
                    </span>
                    <span className={`text-[9px] sm:text-[10px] font-mono uppercase tracking-wider transition-colors duration-300 hidden sm:inline shrink-0 ${
                      isStepActive 
                        ? "text-blue-400 animate-pulse font-bold" 
                        : isStepCompleted 
                        ? "text-emerald-400" 
                        : isStepError 
                        ? "text-rose-400" 
                        : "text-white/10"
                    }`}>
                      {statusLabelText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== Action Buttons ===== */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={runPipeline}
            disabled={!canSubmit || isProcessing}
            className={`flex-1 py-3.5 sm:py-4 rounded-xl font-medium transition flex items-center justify-center gap-2 text-sm sm:text-base ${
              canSubmit && !isProcessing
                ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 cursor-pointer"
                : isProcessing
                ? "bg-white/5 text-white/50 cursor-not-allowed"
                : "bg-white/5 opacity-40 cursor-not-allowed"
            }`}
          >
            {isProcessing ? (
              <>
                <svg className="w-5 h-5 animate-spin text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{statusLabel[status]}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-white/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <span>Compute &amp; Generate 3D Cut Model</span>
              </>
            )}
          </button>

          {isProcessing && (
            <button
              onClick={handleStop}
              className="px-6 py-3.5 sm:py-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition font-medium flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
              <span>Stop Process</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300 break-words">
            {error}
          </div>
        )}
      </div>

      {/* Toast Container */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#161b30",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "0.75rem",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
            padding: "12px 16px",
          },
          success: {
            style: {
              border: "1px solid rgba(16, 185, 129, 0.4)",
              background: "#0c2b20",
            },
          },
          error: {
            style: {
              border: "1px solid rgba(239, 68, 68, 0.4)",
              background: "#2d1616",
            },
            duration: 6000,
          },
        }}
      />
    </div>
  );
}