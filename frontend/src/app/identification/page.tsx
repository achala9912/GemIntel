'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './identification.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const FALLBACK_GEM_TYPES = ['Blue Sapphire', 'Blue Spinel', 'Blue Topaz'];

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
      <header className={styles.header}>
        <h1 className={styles.title}>Feature Identification</h1>
        <p className={styles.subtitle}>
          Choose a gem type, upload one or more gemstone images, and run our AI models to
          identify the <strong>cut</strong> (shape and style) and <strong>color</strong>{' '}
          (hue and saturation).
        </p>
      </header>

      <section className={`glass-panel ${styles.controlPanel}`}>
        <div className={styles.step}>
          <span className={styles.stepBadge}>1</span>
          <div className={styles.stepBody}>
            <label htmlFor="gem-type" className={styles.stepLabel}>Gem type</label>
            <select
              id="gem-type"
              className={styles.select}
              value={gemType}
              onChange={(e) => setGemType(e.target.value)}
              disabled={processing}
            >
              {gemTypes.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
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
            disabled={processing || images.length === 0}
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
