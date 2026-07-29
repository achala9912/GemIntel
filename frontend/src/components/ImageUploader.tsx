'use client';

import { Upload, Trash2, Plus } from 'lucide-react';
import { useState, useRef } from 'react';

interface ImageUploaderProps {
  onAnalyze: (files?: File[] | File | null) => void;
  isAnalyzing: boolean;
  analysisStatus?: string | null;
  buttonText?: string;
  multiple?: boolean;
}

export default function ImageUploader({ 
  onAnalyze, 
  isAnalyzing, 
  buttonText = "Analyze Gem",
  multiple = true
}: ImageUploaderProps) {
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      const newUrls = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newUrls]);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      const newUrls = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newUrls]);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeSingleImage = (indexToRemove: number) => {
    URL.revokeObjectURL(imagePreviews[indexToRemove]);
    setImagePreviews(prev => prev.filter((_, i) => i !== indexToRemove));
    setSelectedFiles(prev => prev.filter((_, i) => i !== indexToRemove));
    if (activePreviewIndex >= imagePreviews.length - 1) {
      setActivePreviewIndex(Math.max(0, imagePreviews.length - 2));
    }
  };

  const clearAllImages = () => {
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImagePreviews([]);
    setSelectedFiles([]);
    setActivePreviewIndex(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentPreview = imagePreviews[activePreviewIndex] || imagePreviews[0];

  return (
    <div className="w-full max-w-xl mx-auto">
      {imagePreviews.length === 0 ? (
        <div 
          className="border-2 border-dashed border-slate-700 rounded-2xl py-8 px-4 sm:py-12 sm:px-8 text-center bg-slate-900/60 cursor-pointer transition-all duration-200 hover:bg-slate-900 hover:border-blue-500"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto mb-3 text-blue-400" />
          <p className="font-semibold text-base sm:text-lg text-slate-100">Upload Gemstone Images</p>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Drag & drop or click to browse (Select single or multiple images)
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            multiple={multiple}
            hidden 
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 animate-fade-in w-full">
          {/* Main Preview Container */}
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-xl aspect-square flex items-center justify-center bg-slate-950 border border-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentPreview} alt="Gemstone Preview" className="w-full h-full object-cover block" />
            
            {/* Upload Counter Badge */}
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-200 px-3 py-1 rounded-full text-xs font-semibold font-mono">
              {imagePreviews.length} {imagePreviews.length === 1 ? 'Image' : 'Images'} Uploaded
            </div>

            {!isAnalyzing && (
              <button 
                className="absolute top-2.5 right-2.5 bg-slate-900/80 hover:bg-red-600 text-white border border-slate-700 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-200 z-10 font-bold" 
                onClick={clearAllImages}
                title="Clear all uploaded images"
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

          {/* Multiple Image Thumbnails Grid */}
          {imagePreviews.length > 1 && (
            <div className="w-full max-w-sm flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {imagePreviews.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => setActivePreviewIndex(idx)}
                  className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition ${
                    activePreviewIndex === idx ? 'border-blue-500 shadow-md' : 'border-slate-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  {!isAnalyzing && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSingleImage(idx);
                      }}
                      className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              
              {!isAnalyzing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-blue-400 flex items-center justify-center shrink-0 transition cursor-pointer"
                  title="Add another image"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            multiple={multiple}
            hidden 
          />

          {/* Action Button */}
          <button 
            className={`w-full max-w-sm py-3.5 sm:py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm sm:text-base ${
              !isAnalyzing
                ? "btn-primary active:scale-[0.99] cursor-pointer"
                : "bg-slate-800 border border-slate-700 cursor-not-allowed text-slate-500"
            }`}
            onClick={() => onAnalyze(selectedFiles.length > 0 ? selectedFiles : null)}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? "Analyzing Pipeline..." : `${buttonText}${selectedFiles.length > 1 ? ` (${selectedFiles.length} Images)` : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}
