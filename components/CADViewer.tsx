
import React, { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Grid,
  Html,
  Edges,
  Stage,
  Sphere,
  Float
} from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { CADFeature } from '../types';
import { AlertTriangle } from 'lucide-react';

const Group = 'group' as any;
const Mesh = 'mesh' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;

interface FeatureHighlightProps {
  feature: CADFeature;
  active: boolean;
  modelBounds?: THREE.Box3;
  isPreviewing: boolean;
}

const FeatureIndicator: React.FC<FeatureHighlightProps> = ({ feature, active, modelBounds, isPreviewing }) => {
  const position = useMemo(() => {
    if (!modelBounds) return new THREE.Vector3(0, 0, 0);
    const center = new THREE.Vector3();
    modelBounds.getCenter(center);
    const size = new THREE.Vector3();
    modelBounds.getSize(size);

    const seed = feature.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offsetX = ((seed % 10) / 10 - 0.5) * size.x * 0.95;
    const offsetY = (((seed >> 2) % 10) / 10 - 0.5) * size.y * 0.95;
    const offsetZ = (((seed >> 4) % 10) / 10 - 0.5) * size.z * 0.95;

    return new THREE.Vector3(center.x + offsetX, center.y + offsetY, center.z + offsetZ);
  }, [feature.id, modelBounds]);

  const isVisible = isPreviewing ? active : true;
  if (!isVisible) return null;

  return (
    <Group position={position}>
      <Float speed={5} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere args={[active ? 3.5 : 1.2, 32, 32]}>
          <MeshStandardMaterial
            color={active ? "#06b6d4" : "#6366f1"}
            emissive={active ? "#22d3ee" : "#4338ca"}
            emissiveIntensity={active ? 30 : 5}
            transparent
            opacity={active ? 1 : 0.8}
          />
        </Sphere>
      </Float>

      {active && (
        <Html distanceFactor={40} position={[0, 8, 0]} center zIndexRange={[2000, 0]}>
          <div className="bg-[#09090b] text-white border-2 border-cyan-500/80 p-8 rounded-[2.5rem] whitespace-nowrap min-w-[380px] shadow-[0_0_80px_rgba(6,182,212,0.5)] backdrop-blur-3xl font-mono uppercase pointer-events-none select-none animate-in fade-in zoom-in-90 slide-in-from-bottom-4 duration-300">
            <div className="border-b-2 border-cyan-500/30 pb-6 mb-8 flex justify-between items-start">
              <div>
                <p className="text-[12px] text-cyan-500 font-black tracking-[0.4em] mb-3">GEOMETRIC_NODE</p>
                <h4 className="text-2xl font-black text-white tracking-tight leading-none italic">{feature.name}</h4>
              </div>
              <div className="bg-cyan-500/20 px-4 py-2 rounded-2xl border border-cyan-500/50 text-xs text-cyan-200 font-black flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                {feature.type}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-0.5 flex-1 bg-white/10"></div>
                <span className="text-[11px] text-zinc-500 font-black tracking-[0.3em]">RECON_METRICS</span>
                <div className="h-0.5 flex-1 bg-white/10"></div>
              </div>

              <div className="grid gap-3">
                {Object.entries(feature.parameters).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-cyan-500/30 transition-all duration-300">
                    <span className="text-[15px] text-zinc-400 font-bold tracking-tight capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl text-white font-black">{val}</span>
                      <span className="text-[12px] text-cyan-600 font-black">MM</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-6 border-t border-white/10 flex justify-between items-end">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-600 font-black tracking-widest">SCAN_CONFIDENCE</span>
                  <span className="text-lg text-emerald-400 font-black italic">{(feature.confidence * 100).toFixed(0)}% ACCURACY</span>
                </div>
                <div className="text-[11px] text-zinc-500 bg-zinc-900 px-4 py-1.5 rounded-full border border-white/10 font-bold">
                  NODE: {feature.id.slice(0, 12)}
                </div>
              </div>
            </div>
          </div>
        </Html>
      )}
    </Group>
  );
};

const STLModel: React.FC<{ url: string; isPreviewing: boolean; onBoundsUpdate: (bounds: THREE.Box3) => void; onError: (msg: string) => void }> = ({ url, isPreviewing, onBoundsUpdate, onError }) => {
  const geometry = useLoader(STLLoader, url);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (geometry) {
      try {
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        if (geometry.boundingBox) {
          onBoundsUpdate(geometry.boundingBox.clone());
        }
      } catch (err) {
        console.error("Geometry processing error:", err);
        onError("High-density mesh topology could not be computed.");
      }
    }
  }, [geometry, onBoundsUpdate, onError]);

  return (
    <Mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <MeshStandardMaterial
        color={isPreviewing ? "#94a3b8" : "#27272a"}
        roughness={isPreviewing ? 0.05 : 0.4}
        metalness={isPreviewing ? 1.0 : 0.6}
        flatShading={!isPreviewing}
        side={THREE.DoubleSide}
      />
      {/* Edges can be expensive on high-density meshes, using threshold to optimize */}
      <Edges
        color={isPreviewing ? "#22d3ee" : "#52525b"}
        threshold={isPreviewing ? 12 : 25}
      />
    </Mesh>
  );
};

interface CADViewerProps {
  modelUrl: string | null;
  features: CADFeature[];
  activeFeatureId: string | null;
  isPreviewing: boolean;
}

const CADViewer: React.FC<CADViewerProps> = ({ modelUrl, features, activeFeatureId, isPreviewing }) => {
  const [modelBounds, setModelBounds] = useState<THREE.Box3 | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0c0c0e]">
        <div className="text-center p-12 bg-red-500/5 border border-red-500/20 rounded-[3rem] backdrop-blur-xl">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-6 animate-pulse" />
          <h3 className="text-xl font-black text-red-500 uppercase italic tracking-tighter mb-3">Load Fatal Error</h3>
          <p className="text-zinc-500 text-sm font-mono max-w-xs">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#0c0c0e] relative cursor-crosshair">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[80, 80, 80]} fov={35} />

        <Suspense fallback={<Html center><div className="text-indigo-400 animate-pulse font-mono text-[11px] font-black tracking-[0.5em] uppercase bg-zinc-900/95 px-10 py-5 rounded-full border border-indigo-500/40 backdrop-blur-2xl">RECO_KERNEL_LOCKING...</div></Html>}>
          <Stage environment="city" intensity={isPreviewing ? 2.5 : 1} shadows="contact" adjustCamera={1.2}>
            {modelUrl && (
              <STLModel
                url={modelUrl}
                isPreviewing={isPreviewing}
                onBoundsUpdate={setModelBounds}
                onError={setLoadError}
              />
            )}

            {modelBounds && features.map((f) => (
              <FeatureIndicator
                key={f.id}
                feature={f}
                active={activeFeatureId === f.id}
                modelBounds={modelBounds}
                isPreviewing={isPreviewing}
              />
            ))}
          </Stage>
        </Suspense>

        <Grid
          infiniteGrid
          fadeDistance={600}
          sectionColor={isPreviewing ? "#0ea5e9" : "#27272a"}
          cellColor="#18181b"
          sectionSize={50}
          cellSize={10}
        />

        <OrbitControls makeDefault minDistance={20} maxDistance={700} />
      </Canvas>

      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-black/90 backdrop-blur-3xl border-2 border-white/5 p-7 rounded-[3rem] text-[11px] font-mono text-zinc-400 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-5 mb-5">
            <div className={`w-3.5 h-3.5 rounded-full ${isPreviewing ? 'bg-cyan-400 animate-pulse shadow-[0_0_25px_#22d3ee]' : 'bg-zinc-700'}`}></div>
            <span className="text-zinc-100 font-black uppercase tracking-[0.4em] italic text-sm">{isPreviewing ? 'B-REP_SYNTH_ACTIVE' : 'MESH_TOPO_SCAN'}</span>
          </div>
          <div className="space-y-2.5 opacity-50 border-l-2 border-white/10 pl-5 ml-1.5">
            <div className="flex justify-between gap-16">
              <span>SCAN_ENGINE:</span>
              <span className="text-zinc-200 font-black">{isPreviewing ? 'G2_CURVE_GEN' : 'POINT_CLOUD_CORE'}</span>
            </div>
            <div className="flex justify-between gap-16">
              <span>DETECTION_COUNT:</span>
              <span className="text-zinc-200 font-black">{features.length} PRIMITIVES</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CADViewer;
