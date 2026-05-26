'use client';

import { useState, useRef } from 'react';
import styles from './ImageUploader.module.css';

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
    <div className={styles.uploaderContainer}>
      {!imagePreview ? (
        <div 
          className={styles.dropzone}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className={styles.icon}>📸</div>
          <h3>Upload Gemstone Image</h3>
          <p>Drag and drop or click to browse</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            hidden 
          />
        </div>
      ) : (
        <div className={`${styles.previewContainer} animate-fade-in`}>
          <div className={styles.imageWrapper}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Gemstone Preview" className={styles.previewImage} />
            {!isAnalyzing && (
              <button className={styles.clearBtn} onClick={clearImage}>✕</button>
            )}
            
            {isAnalyzing && (
              <div className={styles.scanningOverlay}>
                <div className={styles.scanLine}></div>
              </div>
            )}
          </div>
          {isAnalyzing && (
            <div className={styles.statusStepperContainer}>
              <div className={styles.statusSpinner}></div>
              <div className={styles.statusTextContainer}>
                <div className={styles.statusTitle}>GemIntel Pipeline</div>
                <div className={styles.statusDescription}>{analysisStatus || 'Analyzing...'}</div>
              </div>
            </div>
          )}
          
          <button 
            className={`btn-primary ${styles.analyzeBtn}`} 
            onClick={() => onAnalyze(selectedFile)}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="spinner"></span> Analyzing...
              </>
            ) : buttonText}
          </button>
        </div>
      )}
    </div>
  );
}
