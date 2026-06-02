'use client';

import { useState, useRef } from 'react';

interface ImageUploaderProps {
  onAnalyze: (file?: File | null) => void;
  isAnalyzing: boolean;
  analysisStatus?: string | null;
  buttonText?: string;
}

export default function ImageUploader({ 
  onAnalyze, 
  isAnalyzing, 
  analysisStatus = null,
  buttonText = "Analyze Gem" 
}: ImageUploaderProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setSelectedFile(file);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-[600px] mx-auto">
      {!imagePreview ? (
        <div 
          className="border-2 border-dashed border-violet-500/40 rounded-2xl padding py-12 px-8 text-center bg-violet-500/5 cursor-pointer transition-all duration-200 hover:bg-violet-500/10 hover:border-violet-500"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="text-5xl mb-4">📸</div>
          <h3 className="text-lg font-bold mb-1">Upload Gemstone Image</h3>
          <p className="text-sm text-gray-400">Drag and drop or click to browse</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            hidden 
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <div className="relative w-full max-w-[400px] rounded-2xl overflow-hidden shadow-2xl shadow-black/40 aspect-square flex items-center justify-center bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Gemstone Preview" className="w-full h-full object-cover display-block" />
            {!isAnalyzing && (
              <button 
                className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-red-600 text-white border-none rounded-full w-[30px] h-[30px] flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 z-10 font-bold" 
                onClick={clearImage}
              >
                ✕
              </button>
            )}
            
            {isAnalyzing && (
              <div className="absolute inset-0 bg-violet-500/20 pointer-events-none">
                <div className="w-full h-1 bg-gradient-to-r from-violet-500 to-cyan-500 absolute top-0 shadow-[0_0_10px_#8b5cf6,0_0_20px_#06b6d4] animate-scan"></div>
              </div>
            )}
          </div>
          {isAnalyzing && (
            <div className="w-full max-w-[400px] bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex items-center gap-4 backdrop-blur-md shadow-2xl mt-2 animate-fade-in">
              <div className="w-6 h-6 border-2 border-white/10 rounded-full border-t-violet-500 animate-spin shrink-0"></div>
              <div className="flex flex-col gap-1 flex-grow">
                <div className="font-semibold text-sm text-violet-400">GemIntel Pipeline</div>
                <div className="text-xs text-gray-400 font-mono">{analysisStatus || 'Analyzing...'}</div>
              </div>
            </div>
          )}
          
          <button 
            className="w-full max-w-[400px] p-4 text-base font-bold btn-primary disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none" 
            onClick={() => onAnalyze(selectedFile)}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner"></span> Analyzing...
              </span>
            ) : buttonText}
          </button>
        </div>
      )}
    </div>
  );
}
