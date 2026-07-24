'use client';

import { Upload } from 'lucide-react';
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
    <div className="w-full max-w-xl mx-auto">
      {!imagePreview ? (
        <div 
          className="border-2 border-dashed border-slate-700 rounded-2xl py-8 px-4 sm:py-12 sm:px-8 text-center bg-slate-900/60 cursor-pointer transition-all duration-200 hover:bg-slate-900 hover:border-blue-500"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto mb-3 text-blue-400" />
          <p className="font-semibold text-base sm:text-lg text-slate-100">Upload Gemstone Image</p>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Drag & drop or click to browse
          </p>
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
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-xl aspect-square flex items-center justify-center bg-slate-950 border border-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Gemstone Preview" className="w-full h-full object-cover block" />
            {!isAnalyzing && (
              <button 
                className="absolute top-2.5 right-2.5 bg-slate-900/80 hover:bg-red-600 text-white border border-slate-700 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-200 z-10 font-bold" 
                onClick={clearImage}
              >
                ✕
              </button>
            )}
            
            {isAnalyzing && (
              <div className="absolute inset-0 bg-blue-500/10 pointer-events-none">
                <div className="w-full h-1 bg-blue-500 absolute top-0 animate-scan"></div>
              </div>
            )}
          </div>

          
          <button 
            className={`w-full max-w-sm py-3.5 sm:py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm sm:text-base ${
              !isAnalyzing
                ? "btn-primary active:scale-[0.99] cursor-pointer"
                : "bg-slate-800 border border-slate-700 cursor-not-allowed text-slate-500"
            }`}
            onClick={() => onAnalyze(selectedFile)}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? "Analyzing..." : buttonText}
          </button>
        </div>
      )}
    </div>
  );
}
