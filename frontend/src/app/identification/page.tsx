'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import styles from './identification.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const FALLBACK_GEM_TYPES = ['Blue Sapphire', 'Blue Spinel', 'Blue Topaz'];

const getGemColor = (type: string): string => {
  const normalized = type.toLowerCase().trim();
  if (normalized.includes('sapphire')) return '#3b82f6'; // blue
  if (normalized.includes('spinel')) return '#ec4899';   // pink
  if (normalized.includes('topaz')) return '#eab308';    // yellow
  if (normalized.includes('ruby')) return '#ef4444';     // red
  if (normalized.includes('emerald')) return '#10b981';  // green
  if (normalized.includes('diamond')) return '#f3f4f6';  // white/gray
  return '#8b5cf6'; // default purple
};

interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface LabelResult {
  label: string;
  confidence: number;
}

interface CutBlock {
  shape: LabelResult;
  cut_style: LabelResult;
  shape_probs: Record<string, number>;
  cut_style_probs: Record<string, number>;
}

interface ColorBlock {
  hue: LabelResult;
  saturation: LabelResult;
  hue_probs: Record<string, number>;
  saturation_probs: Record<string, number>;
}

interface IdentifyResponse {
  status: string;
  gem_type: string;
  image_count: number;
  aggregate: { cut: CutBlock; color: ColorBlock };
  per_image: Array<{ filename: string; cut: CutBlock; color: ColorBlock }>;
}

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function ProbBars({ probs, accent }: { probs: Record<string, number>; accent: string }) {
  const sorted = Object.entries(probs).sort((a, b) => b[1] - a[1]);
  return (
    <div className={styles.probList}>
      {sorted.map(([k, v]) => (
        <div key={k} className={styles.probRow}>
          <span className={styles.probLabel}>{k}</span>
          <div className={styles.probBarTrack}>
            <div
              className={styles.probBarFill}
              style={{ width: `${v * 100}%`, background: accent }}
            />
          </div>
          <span className={styles.probValue}>{pct(v)}</span>
        </div>
      ))}
    </div>
  );
}

export default function FeatureIdentification() {
  const [gemTypes, setGemTypes] = useState<string[]>(FALLBACK_GEM_TYPES);
  const [gemType, setGemType] = useState<string>(FALLBACK_GEM_TYPES[0]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<IdentifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/gem-types`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.gem_types?.length) {
          setGemTypes(d.gem_types);
          setGemType(d.gem_types[0]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
  }, [images]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const next: UploadedImage[] = [];
    for (const f of Array.from(fileList)) {
      if (!f.type.startsWith('image/')) continue;
      next.push({
        id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        previewUrl: URL.createObjectURL(f),
      });
    }
    if (next.length === 0) return;
    setImages((prev) => [...prev, ...next]);
    setResult(null);
    setError(null);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
    setResult(null);
  };

  const clearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setGemType(gemTypes[0] || '');
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcess = async () => {
    if (!gemType) {
      setError('Please choose a gem type.');
      return;
    }
    if (images.length === 0) {
      setError('Please add at least one image.');
      return;
    }
    setProcessing(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('gem_type', gemType);
      images.forEach((img) => fd.append('files', img.file, img.file.name));
      const res = await fetch(`${API_BASE}/identify`, { method: 'POST', body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || res.statusText || 'Request failed.');
      }
      const data = (await res.json()) as IdentifyResponse;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProcessing(false);
    }
  };

  const accent1 = 'linear-gradient(135deg, #8b5cf6, #06b6d4)';
  const accent2 = 'linear-gradient(135deg, #f59e0b, #ef4444)';

  return (
    <div className={styles.page}>
      <header className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-center mb-2 leading-tight px-2">
          Feature{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Identification
          </span>
        </h1>
        <p className="text-center text-sm sm:text-base opacity-60 max-w-2xl mx-auto px-4">
          Choose a gem type, upload one or more gemstone images, and run our AI models to
          identify the <strong>cut</strong> (shape and style) and <strong>color</strong>{' '}
          (hue and saturation).
        </p>
      </header>

      <section className={`glass-panel ${styles.controlPanel}`}>
        <div className={styles.step}>
          <span className={styles.stepBadge}>1</span>
          <div className={styles.stepBody}>
            <label className={styles.stepLabel}>Gem type</label>
            <div className="relative w-full max-w-xs" ref={dropdownRef}>
              <div
                onClick={() => !processing && setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full bg-[rgba(0,0,0,0.4)] border border-white/10 rounded-xl px-4 py-3 text-sm flex justify-between items-center text-left transition ${
                  processing
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-white/[0.02] active:scale-[0.99] cursor-pointer'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!processing) setIsDropdownOpen(!isDropdownOpen);
                  }
                }}
              >
                {gemType ? (
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] shrink-0"
                      style={{
                        backgroundColor: getGemColor(gemType),
                        color: getGemColor(gemType),
                      }}
                    />
                    <span className="font-semibold text-white truncate">{gemType}</span>
                  </div>
                ) : (
                  <span className="text-white/40 font-medium truncate">Select type...</span>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  {gemType && !processing ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setGemType('');
                      }}
                      className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white/80 transition cursor-pointer"
                      title="Clear selection"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          setGemType('');
                        }
                      }}
                    >
                      <X className="w-3.5 h-3.5 hover:text-red-600" strokeWidth={3} />
                    </span>
                  ) : (
                    <ChevronDown
                      className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
              </div>

              {isDropdownOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-[#0a0c1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1.5 animate-fade-in-pure">
                  {gemTypes.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setGemType(g);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left hover:bg-white/5 transition flex items-center justify-between group cursor-pointer ${
                        gemType === g ? 'bg-white/[0.03]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-110 shrink-0"
                          style={{ backgroundColor: getGemColor(g) }}
                        />
                        <span className="font-semibold text-white text-sm truncate">{g}</span>
                      </div>

                      {gemType === g && (
                        <svg
                          className="w-4 h-4 text-blue-400 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.step}>
          <span className={styles.stepBadge}>2</span>
          <div className={styles.stepBody}>
            <span className={styles.stepLabel}>Upload images</span>
            <div
              className={styles.dropzone}
              onClick={() => !processing && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                if (!processing) addFiles(e.dataTransfer.files);
              }}
            >
              <div className={styles.dropIcon}>📸</div>
              <div className={styles.dropTitle}>Drop images here or click to browse</div>
              <div className={styles.dropHint}>JPG / PNG / WEBP — multiple files allowed</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {images.length > 0 && (
              <div className={styles.thumbsRow}>
                {images.map((img) => (
                  <div key={img.id} className={styles.thumb}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.previewUrl} alt={img.file.name} />
                    <button
                      type="button"
                      className={styles.thumbRemove}
                      onClick={() => removeImage(img.id)}
                      disabled={processing}
                      aria-label={`Remove ${img.file.name}`}
                    >
                      ×
                    </button>
                    <div className={styles.thumbName}>{img.file.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleProcess}
            disabled={processing || images.length === 0}
          >
            {processing ? (<><span className="spinner" /> Processing…</>) : `Process ${images.length || ''} image${images.length === 1 ? '' : 's'}`.trim()}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={clearAll}
            disabled={processing}
          >
            Clear
          </button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}
      </section>

      {result && (
        <section className={`glass-panel ${styles.resultsPanel}`}>
          <div className={styles.resultsHeader}>
            <h2>Identification Result</h2>
            <div className={styles.resultMeta}>
              <span>Gem: <strong>{result.gem_type}</strong></span>
              <span>•</span>
              <span>{result.image_count} image{result.image_count === 1 ? '' : 's'}</span>
            </div>
          </div>

          <div className={styles.resultGrid}>
            <div className={styles.resultCard}>
              <div className={styles.resultCardHeader}>
                <h3>Cut</h3>
                <span className={styles.tag} style={{ background: accent1 }}>DINOv2 multi-task</span>
              </div>
              <div className={styles.bigStats}>
                <div>
                  <div className={styles.bigLabel}>Shape</div>
                  <div className={styles.bigValue}>{result.aggregate.cut.shape.label}</div>
                  <div className={styles.bigConf}>{pct(result.aggregate.cut.shape.confidence)} confidence</div>
                </div>
                <div>
                  <div className={styles.bigLabel}>Cut style</div>
                  <div className={styles.bigValue}>{result.aggregate.cut.cut_style.label}</div>
                  <div className={styles.bigConf}>{pct(result.aggregate.cut.cut_style.confidence)} confidence</div>
                </div>
              </div>
              <div className={styles.probGroupLabel}>Shape distribution</div>
              <ProbBars probs={result.aggregate.cut.shape_probs} accent={accent1} />
              <div className={styles.probGroupLabel}>Cut style distribution</div>
              <ProbBars probs={result.aggregate.cut.cut_style_probs} accent={accent1} />
            </div>

            <div className={styles.resultCard}>
              <div className={styles.resultCardHeader}>
                <h3>Color</h3>
                <span className={styles.tag} style={{ background: accent2 }}>DINOv2 multi-head</span>
              </div>
              <div className={styles.bigStats}>
                <div>
                  <div className={styles.bigLabel}>Hue</div>
                  <div className={styles.bigValue}>{result.aggregate.color.hue.label}</div>
                  <div className={styles.bigConf}>{pct(result.aggregate.color.hue.confidence)} confidence</div>
                </div>
                <div>
                  <div className={styles.bigLabel}>Saturation</div>
                  <div className={styles.bigValue}>{result.aggregate.color.saturation.label}</div>
                  <div className={styles.bigConf}>{pct(result.aggregate.color.saturation.confidence)} confidence</div>
                </div>
              </div>
              <div className={styles.probGroupLabel}>Hue distribution</div>
              <ProbBars probs={result.aggregate.color.hue_probs} accent={accent2} />
              <div className={styles.probGroupLabel}>Saturation distribution</div>
              <ProbBars probs={result.aggregate.color.saturation_probs} accent={accent2} />
            </div>
          </div>

          {result.per_image.length > 1 && (
            <details className={styles.perImageDetails}>
              <summary>Per-image breakdown ({result.per_image.length})</summary>
              <div className={styles.perImageGrid}>
                {result.per_image.map((p, i) => (
                  <div key={`${p.filename}-${i}`} className={styles.perImageCard}>
                    <div className={styles.perImageName}>{p.filename}</div>
                    <div className={styles.perImageRow}>
                      <span>Shape</span>
                      <strong>{p.cut.shape.label}</strong>
                      <span>{pct(p.cut.shape.confidence)}</span>
                    </div>
                    <div className={styles.perImageRow}>
                      <span>Cut</span>
                      <strong>{p.cut.cut_style.label}</strong>
                      <span>{pct(p.cut.cut_style.confidence)}</span>
                    </div>
                    <div className={styles.perImageRow}>
                      <span>Hue</span>
                      <strong>{p.color.hue.label}</strong>
                      <span>{pct(p.color.hue.confidence)}</span>
                    </div>
                    <div className={styles.perImageRow}>
                      <span>Sat</span>
                      <strong>{p.color.saturation.label}</strong>
                      <span>{pct(p.color.saturation.confidence)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </section>
      )}
    </div>
  );
}
