"use client";

/**
 * GemViewer3D component
 * =====================
 * Path: frontend/src/components/GemViewer3D.tsx
 *
 * Reusable Three.js viewer for cut prediction results.
 * Port of the standalone 3D_view_threeJS.html demo, wrapped in a React component.
 *
 * Usage:
 *   <GemViewer3D data={predictionResult} onClose={() => ...} />
 *
 * Dependencies (install in frontend):
 *   npm install three @types/three
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";


// =========================================================
// TYPES
// =========================================================
export interface GemData {
  stone_id?:   string;
  gem_type:    string;
  dimensions:  { length_mm: number; width_mm: number; depth_mm: number };
  prediction:  {
    cut: string;
    yield_pct: number;
    confidence?: number;
    probabilities?: Record<string, number>;
  };
  rough_bbox:  { x: number; y: number; z: number };
  rough_mesh:  {
    vertices: number[];
    indices:  number[];
    vertex_count: number;
    face_count:   number;
  };
}

type ViewMode = "cut" | "overlay" | "rough";
type LookMode = "clean" | "natural";


// =========================================================
// GEM PRESETS (color per species)
// =========================================================
const GEM_PRESETS: Record<string, { color: number; name: string }> = {
  blue_sapphire: { color: 0x1E5AA8, name: "Blue Sapphire" },
  spinel:        { color: 0xC13B5F, name: "Spinel" },
  topaz:         { color: 0xE8A23A, name: "Topaz" },
};


// =========================================================
// CUT GEOMETRY BUILDERS (matches Python builders)
// =========================================================
function buildSmooth6Ring(
  rxFn: (t: number) => number,
  ryFn: (t: number) => number,
  a: number, b: number, dS: number, n = 32
): THREE.BufferGeometry {
  const zt = dS * 0.45, zc = dS * 0.15, zg = 0;
  const zp1 = -dS * 0.22, zp2 = -dS * 0.40, zcu = -dS * 0.52;
  const scales  = [0.55, 0.85, 1.00, 0.62, 0.28, 0.08];
  const heights = [zt, zc, zg, zp1, zp2, zcu];

  const positions: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < 6; r++) {
    const sR = scales[r];
    const z = heights[r];
    for (let i = 0; i < n; i++) {
      const theta = (i / n) * Math.PI * 2;
      const rx = a * rxFn(theta);
      const ry = b * ryFn(theta);
      positions.push(sR * rx, z, sR * ry);   // Three.js: Y is up
    }
  }
  positions.push(0, zt, 0);
  const topCenter = 6 * n;
  positions.push(0, zcu, 0);
  const botCenter = 6 * n + 1;

  for (let r = 0; r < 5; r++) {
    const rA = r * n, rB = (r + 1) * n;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      indices.push(rA + i, rB + i, rB + j);
      indices.push(rA + i, rB + j, rA + j);
    }
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    indices.push(topCenter, j, i);
  }
  const last = 5 * n;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    indices.push(botCenter, last + i, last + j);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

function buildCutGeometry(
  cutType: string, L: number, W: number, D: number
): THREE.BufferGeometry {
  const scaleMap: Record<string, number> = {
    Round: 0.72, Oval: 0.78, Cushion: 0.80, Emerald: 0.82,
  };
  const s = scaleMap[cutType] ?? 0.80;

  if (cutType === "Cushion") {
    const a = (L/2)*s, b = (W/2)*s, dS = D*s, exp = 4;
    return buildSmooth6Ring(
      t => { const c = Math.cos(t); return Math.sign(c) * Math.pow(Math.abs(c), 2/exp); },
      t => { const c = Math.sin(t); return Math.sign(c) * Math.pow(Math.abs(c), 2/exp); },
      a, b, dS
    );
  }
  if (cutType === "Round") {
    const r = (Math.min(L, W)/2)*s, dS = D*s;
    return buildSmooth6Ring(t => Math.cos(t), t => Math.sin(t), r, r, dS);
  }
  // Oval or Emerald (treated as oval-like for now)
  const a = (L/2)*s, b = (W/2)*s, dS = D*s;
  return buildSmooth6Ring(t => Math.cos(t), t => Math.sin(t), a, b, dS);
}


// =========================================================
// ZONING TEXTURE (natural sapphire color variation)
// =========================================================
function makeZoningTexture(baseColorHex: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const base = new THREE.Color(baseColorHex);
  const r = Math.floor(base.r * 255);
  const g = Math.floor(base.g * 255);
  const b = Math.floor(base.b * 255);

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 14; i++) {
    const lighter = Math.random() > 0.5;
    const shift = lighter ? 50 : -45;
    const rr = Math.max(0, Math.min(255, r + shift));
    const gg = Math.max(0, Math.min(255, g + shift));
    const bb = Math.max(0, Math.min(255, b + shift + 20));
    ctx.fillStyle = `rgba(${rr},${gg},${bb},${0.18 + Math.random() * 0.2})`;
    ctx.save();
    ctx.translate(Math.random() * size, Math.random() * size);
    ctx.rotate((Math.random() - 0.5) * 1.2);
    ctx.fillRect(-50, -15, 100, 30);
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}


// =========================================================
// COMPONENT
// =========================================================
export default function GemViewer3D({
  data,
  onClose,
}: {
  data: GemData;
  onClose?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewMode>("overlay");
  const [look, setLook] = useState<LookMode>("clean");
  const [autoRotate, setAutoRotate] = useState(true);

  // Three.js refs we need to control from React state
  const sceneRef     = useRef<THREE.Scene | null>(null);
  const cutMeshRef   = useRef<THREE.Mesh | null>(null);
  const cutEdgesRef  = useRef<THREE.LineSegments | null>(null);
  const roughMeshRef = useRef<THREE.Mesh | null>(null);
  const roughWfRef   = useRef<THREE.LineSegments | null>(null);
  const inclusionsRef = useRef<THREE.Points | null>(null);
  const materialRef  = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const zoningTexRef = useRef<THREE.CanvasTexture | null>(null);
  const controlsRef  = useRef<OrbitControls | null>(null);

  // ---- Initial Three.js setup ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      35, container.clientWidth / container.clientHeight, 0.1, 100
    );
    camera.position.set(8, 6, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(5, 8, 5); scene.add(key);
    const fill = new THREE.DirectionalLight(0x8eb5ff, 0.7);
    fill.position.set(-5, 3, -5); scene.add(fill);
    const rim = new THREE.PointLight(0xffd9b3, 0.6, 30);
    rim.position.set(0, -3, 6); scene.add(rim);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;
    controls.minDistance = 4;
    controls.maxDistance = 25;
    controlsRef.current = controls;

    // ----- Load gem data -----
    const preset = GEM_PRESETS[data.gem_type] || GEM_PRESETS.blue_sapphire;

    // Cut dimensions (use rough bbox for proper fit)
    const FIT_XZ = 0.85;
    const L = data.rough_bbox.x * FIT_XZ;
    const W = data.rough_bbox.z * FIT_XZ;
    const propDepth = W * 0.58;
    const maxDepth  = data.rough_bbox.y * 0.80;
    const D = Math.min(propDepth, maxDepth);

    // Cut mesh
    const cutGeom = buildCutGeometry(data.prediction.cut, L, W, D);
    const zoningTex = makeZoningTexture(preset.color);
    zoningTexRef.current = zoningTex;

    const cutMat = new THREE.MeshPhysicalMaterial({
      color:                preset.color,
      metalness:            0.0,
      roughness:            0.18,
      transmission:         0.55,
      thickness:            2.0,
      ior:                  1.77,
      attenuationColor:     new THREE.Color(preset.color),
      attenuationDistance:  0.9,
      clearcoat:            0.35,
      clearcoatRoughness:   0.25,
      envMapIntensity:      0.9,
      side:                 THREE.DoubleSide,
    });
    materialRef.current = cutMat;

    const cutMesh = new THREE.Mesh(cutGeom, cutMat);
    cutMeshRef.current = cutMesh;
    scene.add(cutMesh);

    const cutEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(cutGeom, 1),
      new THREE.LineBasicMaterial({ color: 0x4187E0, transparent: true, opacity: 0.3 })
    );
    cutEdgesRef.current = cutEdges;
    scene.add(cutEdges);

    // Rough mesh (from backend JSON)
    if (data.rough_mesh?.vertices?.length) {
      const roughGeom = new THREE.BufferGeometry();
      roughGeom.setAttribute("position", new THREE.Float32BufferAttribute(data.rough_mesh.vertices, 3));
      roughGeom.setIndex(data.rough_mesh.indices);
      roughGeom.computeVertexNormals();

      const roughMat = new THREE.MeshPhysicalMaterial({
        color: 0x8da9d4,
        metalness: 0.0,
        roughness: 0.55,
        transmission: 0.75,
        thickness: 0.3,
        opacity: 0.20,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const roughMesh = new THREE.Mesh(roughGeom, roughMat);
      roughMeshRef.current = roughMesh;
      scene.add(roughMesh);

      const roughWf = new THREE.LineSegments(
        new THREE.WireframeGeometry(roughGeom),
        new THREE.LineBasicMaterial({ color: 0xa8c4ff, transparent: true, opacity: 0.15 })
      );
      roughWfRef.current = roughWf;
      scene.add(roughWf);
    }

    // Inclusions (silk particles)
    const incCount = 60;
    const incPositions: number[] = [];
    const ia = (L/2) * 0.78 * 0.7;
    const ib = (W/2) * 0.78 * 0.7;
    const ic = (D    * 0.78) * 0.35;
    for (let i = 0; i < incCount; i++) {
      let x, y, z;
      do {
        x = Math.random()*2 - 1;
        y = Math.random()*2 - 1;
        z = Math.random()*2 - 1;
      } while (x*x + y*y + z*z > 1);
      incPositions.push(x*ia, y*ic, z*ib);
    }
    const incGeom = new THREE.BufferGeometry();
    incGeom.setAttribute("position", new THREE.Float32BufferAttribute(incPositions, 3));
    const inc = new THREE.Points(incGeom, new THREE.PointsMaterial({
      color: 0xdce8ff, size: 0.03, transparent: true,
      opacity: 0.35, sizeAttenuation: true,
    }));
    inc.visible = false;
    inclusionsRef.current = inc;
    scene.add(inc);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(15, 64),
      new THREE.MeshStandardMaterial({
        color: 0x0a0c1a, metalness: 0.5, roughness: 0.6,
        transparent: true, opacity: 0.5,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3;
    scene.add(floor);

    // Fit camera
    const maxDim = Math.max(data.rough_bbox.x, data.rough_bbox.y, data.rough_bbox.z);
    const dist = maxDim * 2.5;
    camera.position.set(dist * 0.7, dist * 0.5, dist);
    controls.target.set(0, 0, 0);
    controls.update();

    // ---- Animation loop ----
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ---- Resize ----
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [data]);


  // ---- View toggle effect ----
  useEffect(() => {
    if (cutMeshRef.current)   cutMeshRef.current.visible   = view !== "rough";
    if (cutEdgesRef.current)  cutEdgesRef.current.visible  = view !== "rough";
    if (roughMeshRef.current) roughMeshRef.current.visible = view !== "cut";
    if (roughWfRef.current)   roughWfRef.current.visible   = view !== "cut";
    if (inclusionsRef.current) {
      inclusionsRef.current.visible = (look === "natural") && (view !== "rough");
    }
  }, [view, look]);


  // ---- Look toggle effect ----
  useEffect(() => {
    const mat = materialRef.current;
    const tex = zoningTexRef.current;
    if (!mat) return;

    if (look === "natural") {
      mat.map = tex;
      mat.roughness = 0.28;
      mat.clearcoat = 0.2;
      mat.clearcoatRoughness = 0.4;
      mat.transmission = 0.45;
      mat.envMapIntensity = 0.7;
    } else {
      mat.map = null;
      mat.roughness = 0.18;
      mat.clearcoat = 0.35;
      mat.clearcoatRoughness = 0.25;
      mat.transmission = 0.55;
      mat.envMapIntensity = 0.9;
    }
    mat.needsUpdate = true;
  }, [look]);


  // ---- Auto-rotate toggle ----
  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
  }, [autoRotate]);


  // =========================================================
  // RENDER
  // =========================================================
  const preset = GEM_PRESETS[data.gem_type] || GEM_PRESETS.blue_sapphire;
  const { length_mm: L, width_mm: W, depth_mm: D } = data.dimensions;
  const lw = (L / W).toFixed(2);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Info panel */}
      <div className="absolute top-6 left-6 bg-[rgba(15,18,30,0.78)] backdrop-blur-md border border-white/10 rounded-2xl p-5 max-w-xs">
        <span className="inline-block text-xs px-3 py-1 rounded-full bg-blue-600 mb-2">AI Predicted</span>
        <h1 className="text-lg font-semibold">{data.stone_id || "Gem"}</h1>
        <p className="text-sm opacity-60 mb-4">
          {preset.name} · {data.prediction.cut} Cut
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm border-t border-white/10 pt-3">
          <div><div className="text-xs opacity-50 uppercase">Length</div><div>{L.toFixed(2)} mm</div></div>
          <div><div className="text-xs opacity-50 uppercase">Width</div><div>{W.toFixed(2)} mm</div></div>
          <div><div className="text-xs opacity-50 uppercase">Depth</div><div>{D.toFixed(2)} mm</div></div>
          <div><div className="text-xs opacity-50 uppercase">L/W Ratio</div><div>{lw}</div></div>
          <div><div className="text-xs opacity-50 uppercase">Yield</div><div>{data.prediction.yield_pct.toFixed(1)}%</div></div>
          {data.prediction.confidence !== undefined && (
            <div><div className="text-xs opacity-50 uppercase">Confidence</div><div>{data.prediction.confidence.toFixed(0)}%</div></div>
          )}
        </div>
      </div>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 bg-[rgba(15,18,30,0.78)] backdrop-blur-md border border-white/10 rounded-lg px-4 py-2 text-sm"
        >
          ✕ Close
        </button>
      )}

      {/* Controls bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[rgba(15,18,30,0.78)] backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 flex gap-3 items-center text-sm">
        <span className="opacity-60 text-xs">View:</span>
        {(["cut", "overlay", "rough"] as ViewMode[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-lg ${
              view === v ? "bg-blue-700" : "border border-white/15 hover:bg-white/5"
            }`}
          >{v === "cut" ? "Cut Only" : v === "overlay" ? "Rough + Cut" : "Rough Only"}</button>
        ))}

        <span className="opacity-60 text-xs ml-2">Look:</span>
        {(["clean", "natural"] as LookMode[]).map(l => (
          <button
            key={l}
            onClick={() => setLook(l)}
            className={`px-3 py-1.5 rounded-lg ${
              look === l ? "bg-blue-700" : "border border-white/15 hover:bg-white/5"
            }`}
          >{l === "clean" ? "Clean" : "Natural"}</button>
        ))}

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`ml-2 px-3 py-1.5 rounded-lg ${
            autoRotate ? "bg-blue-700" : "border border-white/15 hover:bg-white/5"
          }`}
        >{autoRotate ? "Auto" : "Manual"}</button>
      </div>
    </div>
  );
}