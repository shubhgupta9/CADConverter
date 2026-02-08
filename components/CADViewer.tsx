
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
  theme: 'dark' | 'light';
}

const FeatureIndicator: React.FC<FeatureHighlightProps> = ({ feature, active, modelBounds, isPreviewing, theme }) => {
  const isDark = theme === 'dark';
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
            color={active ? "#3b82f6" : "#1d4ed8"} 
            emissive={active ? "#60a5fa" : "#1e40af"}
            emissiveIntensity={active ? 30 : 5}
            transparent
            opacity={active ? 1 : 0.8}
          />
        </Sphere>
      </Float>
      
      {active && (
        <Html distanceFactor={40} position={[0, 8, 0]} center zIndexRange={[2000, 0]}>
          <div className={`${isDark ? 'bg-[#09090b] text-white border-blue-600/80 shadow-blue-500/50' : 'bg-white text-zinc-900 border-blue-800/80 shadow-blue-800/20'} border-2 p-8 rounded-[2.5rem] whitespace-nowrap min-w-[380px] backdrop-blur-3xl font-mono uppercase pointer-events-none select-none animate-in fade-in zoom-in-90 slide-in-from-bottom-4 duration-300`}>
            <div className={`border-b-2 pb-6 mb-8 flex justify-between items-start ${isDark ? 'border-blue-600/30' : 'border-blue-800/10'}`}>
              <div>
                <p className={`text-[12px] font-black tracking-[0.4em] mb-3 ${isDark ? 'text-blue-500' : 'text-blue-700'}`}>GEOMETRIC_NODE</p>
                <h4 className="text-2xl font-black tracking-tight leading-none italic">{feature.name}</h4>
              </div>
              <div className={`px-4 py-2 rounded-2xl border text-xs font-black flex items-center gap-3 ${isDark ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : 'bg-blue-50 border-blue-800/20 text-blue-800'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`}></div>
                {feature.type}
              </div>
            </div>

            <div className="space-y-4">
              <div className={`flex justify-between items-center p-5 rounded-3xl border transition-all duration-300 ${isDark ? 'bg-white/5 border-white/5 hover:border-blue-500/30' : 'bg-zinc-50 border-zinc-200 hover:border-blue-800/30'}`}>
                <span className="text-[15px] font-bold tracking-tight capitalize">Feature Confidence</span>
                <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-blue-800'}`}>{(feature.confidence * 100).toFixed(0)}%</span>
              </div>
              
              <div className="grid gap-3">
                {Object.entries(feature.parameters).map(([key, val]) => (
                  <div key={key} className={`flex justify-between items-center p-5 rounded-3xl border transition-all duration-300 ${isDark ? 'bg-white/5 border-white/5 hover:border-blue-500/30' : 'bg-zinc-50 border-zinc-200 hover:border-blue-800/30'}`}>
                    <span className="text-[15px] font-bold tracking-tight capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>{val}</span>
                      <span className={`text-[12px] font-black ${isDark ? 'text-blue-600' : 'text-blue-800'}`}>MM</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Html>
      )}
    </Group>
  );
};

const STLModel: React.FC<{ url: string; isPreviewing: boolean; onBoundsUpdate: (bounds: THREE.Box3) => void; theme: 'dark' | 'light' }> = ({ url, isPreviewing, onBoundsUpdate, theme }) => {
  const isDark = theme === 'dark';
  const geometry = useLoader(STLLoader, url);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (geometry) {
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      if (geometry.boundingBox) onBoundsUpdate(geometry.boundingBox.clone());
    }
  }, [geometry, onBoundsUpdate]);

  return (
    <Mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <MeshStandardMaterial 
        color={isPreviewing ? (isDark ? "#94a3b8" : "#cbd5e1") : (isDark ? "#27272a" : "#e2e8f0")} 
        roughness={isPreviewing ? 0.05 : 0.4} 
        metalness={isPreviewing ? 1.0 : 0.3} 
        flatShading={!isPreviewing}
        side={THREE.DoubleSide}
      />
      <Edges 
        color={isPreviewing ? (isDark ? "#3b82f6" : "#1d4ed8") : (isDark ? "#52525b" : "#94a3b8")} 
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
  theme: 'dark' | 'light';
}

const CADViewer: React.FC<CADViewerProps> = ({ modelUrl, features, activeFeatureId, isPreviewing, theme }) => {
  const [modelBounds, setModelBounds] = useState<THREE.Box3 | null>(null);
  const isDark = theme === 'dark';

  return (
    <div className={`w-full h-full relative cursor-crosshair ${isDark ? 'bg-[#0c0c0e]' : 'bg-white'}`}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[80, 80, 80]} fov={35} />
        <Suspense fallback={<Html center><div className="text-blue-600 animate-pulse font-black uppercase bg-zinc-900/10 px-10 py-5 rounded-full backdrop-blur-2xl">SCANNING_CORE...</div></Html>}>
          <Stage environment="city" intensity={isPreviewing ? 2.5 : 1} shadows="contact" adjustCamera={1.2}>
            {modelUrl && (
              <STLModel 
                url={modelUrl} 
                isPreviewing={isPreviewing} 
                onBoundsUpdate={setModelBounds} 
                theme={theme}
              />
            )}
            {modelBounds && features.map((f) => (
              <FeatureIndicator 
                key={f.id} 
                feature={f} 
                active={activeFeatureId === f.id} 
                modelBounds={modelBounds}
                isPreviewing={isPreviewing}
                theme={theme}
              />
            ))}
          </Stage>
        </Suspense>
        <Grid 
          infiniteGrid 
          fadeDistance={600} 
          sectionColor={isDark ? "#1d4ed822" : "#1d4ed811"} 
          cellColor={isDark ? "#18181b" : "#e2e8f0"} 
          sectionSize={50} 
          cellSize={10} 
        />
        <OrbitControls makeDefault minDistance={20} maxDistance={700} />
      </Canvas>

      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className={`backdrop-blur-3xl border-2 p-7 rounded-[3rem] text-[11px] font-mono shadow-xl ${isDark ? 'bg-black/90 border-white/5 text-zinc-400' : 'bg-white/90 border-zinc-200 text-zinc-600'}`}>
          <div className="flex items-center gap-5 mb-5">
            <div className={`w-3.5 h-3.5 rounded-full ${isPreviewing ? 'bg-blue-600 animate-pulse shadow-[0_0_25px_#2563eb]' : 'bg-zinc-300'}`}></div>
            <span className={`font-black uppercase tracking-[0.4em] italic text-sm ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{isPreviewing ? 'B-REP_SYNTH_ACTIVE' : 'MESH_TOPO_SCAN'}</span>
          </div>
          <div className={`space-y-2.5 border-l-2 pl-5 ml-1.5 ${isDark ? 'border-white/10 opacity-50' : 'border-zinc-200'}`}>
            <div className="flex justify-between gap-16">
              <span>SCAN_ENGINE:</span>
              <span className={`font-black ${isDark ? 'text-zinc-200' : 'text-blue-800'}`}>{isPreviewing ? 'G2_CURVE_GEN' : 'POINT_CLOUD_CORE'}</span>
            </div>
            <div className="flex justify-between gap-16">
              <span>DETECTION:</span>
              <span className={`font-black ${isDark ? 'text-zinc-200' : 'text-blue-800'}`}>{features.length} PRIMITIVES</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CADViewer;
