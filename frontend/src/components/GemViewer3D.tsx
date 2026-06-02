"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";


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


interface GemPreset {
  color: number;          
  attenuation: number;     
  fire: number;           
  name: string;
  ior: number;            
  attenuationDist: number; 
  saturationBoost: number; 
}

const GEM_PRESETS: Record<string, GemPreset> = {
  blue_sapphire: {
    color: 0x1a4f96,
    attenuation: 0x0a1e50,
    fire: 0x6baeff,
    name: "Blue Sapphire",
    ior: 1.77,
    attenuationDist: 2.5,
    saturationBoost: 1.2,
  },
  spinel: {
    color: 0xa8234a,
    attenuation: 0x5c0a22,
    fire: 0xff6b8a,
    name: "Spinel",
    ior: 1.72,
    attenuationDist: 2.2,
    saturationBoost: 1.0,
  },
  topaz: {
    color: 0xc48520,
    attenuation: 0x6e4408,
    fire: 0xffe4a0,
    name: "Topaz",
    ior: 1.63,
    attenuationDist: 3.0,
    saturationBoost: 0.8,
  },
};



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
      positions.push(sR * rx, z, sR * ry);   
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
 
  const a = (L/2)*s, b = (W/2)*s, dS = D*s;
  return buildSmooth6Ring(t => Math.cos(t), t => Math.sin(t), a, b, dS);
}



// ZONING TEXTURE (natural color banding + silk inclusions)

function makeZoningTexture(baseColorHex: number, boost: number = 1.0): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const base = new THREE.Color(baseColorHex);
  const r = Math.floor(base.r * 255);
  const g = Math.floor(base.g * 255);
  const b = Math.floor(base.b * 255);

  // Base fill
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, size, size);

  // Angular growth zoning bands (mimics natural crystal growth)
  for (let i = 0; i < 20; i++) {
    const lighter = Math.random() > 0.45;
    const intensity = (lighter ? 35 : -30) * boost;
    const rr = Math.max(0, Math.min(255, r + intensity));
    const gg = Math.max(0, Math.min(255, g + intensity * 0.7));
    const bb = Math.max(0, Math.min(255, b + intensity + 15));
    const alpha = 0.08 + Math.random() * 0.14;
    ctx.fillStyle = `rgba(${rr},${gg},${bb},${alpha})`;
    ctx.save();
    ctx.translate(Math.random() * size, Math.random() * size);
    ctx.rotate((Math.random() - 0.5) * 2.0);
    // Elongated bands for natural growth appearance
    const bw = 60 + Math.random() * 140;
    const bh = 8 + Math.random() * 18;
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.restore();
  }

  // Subtle hexagonal zoning (characteristic of corundum)
  for (let i = 0; i < 6; i++) {
    const cx = size / 2 + (Math.random() - 0.5) * 80;
    const cy = size / 2 + (Math.random() - 0.5) * 80;
    const radius = 40 + Math.random() * 80;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const lighter = Math.random() > 0.5;
    const s = lighter ? 25 : -20;
    grad.addColorStop(0, `rgba(${r+s},${g+s},${b+s},0.12)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }


  ctx.strokeStyle = `rgba(255,255,255,0.04)`;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 30; i++) {
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    const angle = (Math.floor(Math.random() * 3) * 60) * (Math.PI / 180);
    const len = 15 + Math.random() * 40;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

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


  const sceneRef     = useRef<THREE.Scene | null>(null);
  const cutMeshRef   = useRef<THREE.Mesh | null>(null);
  const cutEdgesRef  = useRef<THREE.LineSegments | null>(null);
  const roughMeshRef = useRef<THREE.Mesh | null>(null);
  const roughWfRef   = useRef<THREE.LineSegments | null>(null);
  const inclusionsRef = useRef<THREE.Points | null>(null);
  const materialRef  = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const zoningTexRef = useRef<THREE.CanvasTexture | null>(null);
  const controlsRef  = useRef<OrbitControls | null>(null);


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

    scene.add(new THREE.AmbientLight(0xffffff, 0.15));


    const key = new THREE.DirectionalLight(0xfff5e6, 2.0);
    key.position.set(4, 10, 3);
    scene.add(key);

    const crownFire = new THREE.DirectionalLight(0xe8f0ff, 1.2);
    crownFire.position.set(-2, 8, 6);
    scene.add(crownFire);
    const fill = new THREE.DirectionalLight(0x8eb5ff, 0.4);
    fill.position.set(-6, 2, -4);
    scene.add(fill);

    // Rim/back light: warm accent to separate gem from background
    const rim = new THREE.PointLight(0xffd9b3, 0.5, 25);
    rim.position.set(0, -2, 7);
    scene.add(rim);

    // Under-pavilion glow: faint light from below to simulate light leakage through pavilion
    const pavilionGlow = new THREE.PointLight(0xffffff, 0.2, 15);
    pavilionGlow.position.set(0, -5, 0);
    scene.add(pavilionGlow);

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


    const cutGeom = buildCutGeometry(data.prediction.cut, L, W, D);
    const zoningTex = makeZoningTexture(preset.color, preset.saturationBoost);
    zoningTexRef.current = zoningTex;


    const cutMat = new THREE.MeshPhysicalMaterial({
      color:                new THREE.Color(preset.color).multiplyScalar(1.4),
      metalness:            0.0,
      roughness:            0.05,       
      transmission:         0.92,         
      thickness:            3.5,          
      ior:                  preset.ior,
      attenuationColor:     new THREE.Color(preset.attenuation),
      attenuationDistance:  preset.attenuationDist,
      clearcoat:            1.0,         
      clearcoatRoughness:   0.03,       
      specularIntensity:    1.0,     
      specularColor:        new THREE.Color(preset.fire),
      sheen:                0.15,      
      sheenRoughness:       0.3,
      sheenColor:           new THREE.Color(preset.fire),
      envMapIntensity:      1.5,          
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

    // Inclusions (silk particles – rutile needles characteristic of natural corundum)
    const incCount = 120;
    const incPositions: number[] = [];
    const ia = (L/2) * 0.78 * 0.65;
    const ib = (W/2) * 0.78 * 0.65;
    const ic = (D    * 0.78) * 0.30;
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
      color: 0xc8d8ff, size: 0.025, transparent: true,
      opacity: 0.22, sizeAttenuation: true,
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


    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();


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



  useEffect(() => {
    if (cutMeshRef.current)   cutMeshRef.current.visible   = view !== "rough";
    if (cutEdgesRef.current)  cutEdgesRef.current.visible  = view !== "rough";
    if (roughMeshRef.current) roughMeshRef.current.visible = view !== "cut";
    if (roughWfRef.current)   roughWfRef.current.visible   = view !== "cut";
    if (inclusionsRef.current) {
      inclusionsRef.current.visible = (look === "natural") && (view !== "rough");
    }
  }, [view, look]);



  useEffect(() => {
    const mat = materialRef.current;
    const tex = zoningTexRef.current;
    if (!mat) return;

    const preset = GEM_PRESETS[data.gem_type] || GEM_PRESETS.blue_sapphire;

    if (look === "natural") {

      mat.map = tex;
      mat.roughness = 0.08;              
      mat.clearcoat = 0.8;
      mat.clearcoatRoughness = 0.08;
      mat.transmission = 0.82;          
      mat.thickness = 4.0;              
      mat.attenuationDistance = preset.attenuationDist * 0.7;
      mat.envMapIntensity = 1.2;
      mat.sheen = 0.3;              
    } else {
 
      mat.map = null;
      mat.roughness = 0.05;
      mat.clearcoat = 1.0;
      mat.clearcoatRoughness = 0.03;
      mat.transmission = 0.92;
      mat.thickness = 3.5;
      mat.attenuationDistance = preset.attenuationDist;
      mat.envMapIntensity = 1.5;
      mat.sheen = 0.15;
    }
    mat.needsUpdate = true;
  }, [look, data.gem_type]);


  // ---- Auto-rotate toggle ----
  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
  }, [autoRotate]);


  
  const preset = GEM_PRESETS[data.gem_type] || GEM_PRESETS.blue_sapphire;
  const { length_mm: L, width_mm: W, depth_mm: D } = data.dimensions;
  const lw = (L / W).toFixed(2);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Info panel */}
      <div className="absolute top-3 left-3 sm:top-6 sm:left-6 bg-[rgba(15,18,30,0.82)] backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-5 max-w-[11rem] sm:max-w-xs z-10">
        <span className="inline-block text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-blue-600 mb-1.5 sm:mb-2">AI Predicted</span>
        <h1 className="text-sm sm:text-lg font-semibold leading-tight truncate">{data.stone_id || "Gem"}</h1>
        <p className="text-[11px] sm:text-sm opacity-60 mb-2 sm:mb-4 truncate">
          {preset.name} · {data.prediction.cut} Cut
        </p>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-3 text-[11px] sm:text-sm border-t border-white/10 pt-2 sm:pt-3">
          <div><div className="text-[9px] sm:text-xs opacity-50 uppercase">Length</div><div>{L.toFixed(2)} mm</div></div>
          <div><div className="text-[9px] sm:text-xs opacity-50 uppercase">Width</div><div>{W.toFixed(2)} mm</div></div>
          <div><div className="text-[9px] sm:text-xs opacity-50 uppercase">Depth</div><div>{D.toFixed(2)} mm</div></div>
          <div><div className="text-[9px] sm:text-xs opacity-50 uppercase">L/W</div><div>{lw}</div></div>
          <div><div className="text-[9px] sm:text-xs opacity-50 uppercase">Yield</div><div>{data.prediction.yield_pct.toFixed(1)}%</div></div>
          {data.prediction.confidence !== undefined && (
            <div><div className="text-[9px] sm:text-xs opacity-50 uppercase">Conf.</div><div>{data.prediction.confidence.toFixed(0)}%</div></div>
          )}
        </div>
      </div>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-6 sm:right-6 bg-[rgba(15,18,30,0.82)] backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm z-10"
        >
          ✕ Close
        </button>
      )}

      {/* Controls bar */}
      <div className="absolute bottom-3 sm:bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-auto bg-[rgba(15,18,30,0.82)] backdrop-blur-md border border-white/10 rounded-xl px-3 sm:px-6 py-2.5 sm:py-4 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-5">
          {/* View controls */}
          <div className="flex gap-1.5 sm:gap-3 items-center justify-center text-[11px] sm:text-base">
            <span className="opacity-60 text-[10px] sm:text-sm font-medium">View:</span>
            {(["cut", "overlay", "rough"] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2 sm:px-5 py-1 sm:py-2 rounded-lg whitespace-nowrap transition ${
                  view === v ? "bg-blue-700" : "border border-white/15 hover:bg-white/5"
                }`}
              >{v === "cut" ? "Cut" : v === "overlay" ? "R+Cut" : "Rough"}<span className="hidden sm:inline">{v === "cut" ? " Only" : v === "overlay" ? "" : " Only"}</span></button>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-7 bg-white/10" />

          {/* Look + Rotate */}
          <div className="flex gap-1.5 sm:gap-3 items-center justify-center mt-1.5 sm:mt-0 text-[11px] sm:text-base">
            <span className="opacity-60 text-[10px] sm:text-sm font-medium">Look:</span>
            {(["clean", "natural"] as LookMode[]).map(l => (
              <button
                key={l}
                onClick={() => setLook(l)}
                className={`px-2 sm:px-5 py-1 sm:py-2 rounded-lg transition ${
                  look === l ? "bg-blue-700" : "border border-white/15 hover:bg-white/5"
                }`}
              >{l === "clean" ? "Clean" : "Natural"}</button>
            ))}
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-2 sm:px-5 py-1 sm:py-2 rounded-lg transition ${
                autoRotate ? "bg-blue-700" : "border border-white/15 hover:bg-white/5"
              }`}
            >{autoRotate ? "Auto" : "Manual"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}