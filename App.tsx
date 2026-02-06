
import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Database,
  Cpu,
  Layers,
  LayoutGrid,
  AlertTriangle,
  Info,
  Play,
  Zap
} from 'lucide-react';
import CADViewer from './components/CADViewer';
import Sidebar from './components/Sidebar';
import AnalysisPanel from './components/AnalysisPanel';
import { analyzeMeshFeatures } from './services/geminiService';
import { AppState, AnalysisResult, HistoryItem } from './types';

interface ExtendedAppState extends AppState {
  modelUrl: string | null;
  errorMessage: string | null;
  warningMessage: string | null;
}

// Simple UUID v4 generator for browser compatibility
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const App: React.FC = () => {
  const [state, setState] = useState<ExtendedAppState>({
    currentFile: null,
    modelUrl: null,
    isAnalyzing: false,
    isReconstructing: false,
    isPreviewing: false,
    analysisResult: null,
    activeFeatureId: null,
    history: [],
    errorMessage: null,
    warningMessage: null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      state.history.forEach(item => URL.revokeObjectURL(item.modelUrl));
    };
  }, []);

  const validateFile = async (file: File): Promise<{ error: string | null; warning: string | null }> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'stl') {
      return { error: "Unsupported format. Only industrial .STL mesh files are accepted.", warning: null };
    }

    const MAX_SIZE = 150 * 1024 * 1024;
    const WARNING_SIZE = 50 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      return { error: "File exceeds 150MB platform limit. Please optimize the mesh geometry.", warning: null };
    }

    if (file.size < 84) {
      return { error: "Invalid STL: File header truncated.", warning: null };
    }

    let warning: string | null = null;
    if (file.size > WARNING_SIZE) {
      warning = "Large file detected. Rendering performance may be impacted.";
    }

    try {
      const buffer = await file.slice(0, 128).arrayBuffer();
      const header = new Uint8Array(buffer);

      const first5 = new TextDecoder().decode(header.slice(0, 5));
      if (first5.toLowerCase() === 'solid') {
        return { error: null, warning };
      }

      const dataView = new DataView(buffer);
      const facetCount = dataView.getUint32(80, true);
      const expectedSize = 84 + (facetCount * 50);

      if (facetCount > 10000000) {
        return { error: "Extreme density mesh (>10M facets) exceeds browser memory limits.", warning: null };
      }

      if (Math.abs(expectedSize - file.size) > 1024 * 1024) {
        return { error: "Corrupted Binary STL: Header facet count inconsistent with file size.", warning: null };
      }

      if (facetCount > 2000000) {
        warning = `High-density mesh (${(facetCount / 1000000).toFixed(1)}M facets). Analysis may take longer.`;
      }
    } catch (e) {
      return { error: "Header parsing failed: File is unreadable or locked.", warning: null };
    }

    return { error: null, warning };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState(prev => ({ ...prev, errorMessage: null, warningMessage: null }));

    const { error, warning } = await validateFile(file);
    if (error) {
      setState(prev => ({ ...prev, errorMessage: error }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const newUrl = URL.createObjectURL(file);

    // Only load the file into preview state, do not trigger AI yet
    setState(prev => ({
      ...prev,
      currentFile: file,
      modelUrl: newUrl,
      isAnalyzing: false, // Explicitly false
      analysisResult: null,
      activeFeatureId: null,
      isPreviewing: false,
      errorMessage: null,
      warningMessage: warning
    }));
  };

  const handleStartAnalysis = async () => {
    if (!state.currentFile || !state.modelUrl) return;

    // Quick runtime validation for required env vars to provide a user-friendly error
    const RUNTIME_API_KEY = (import.meta as any).env?.VITE_API_KEY as string | undefined;
    const RUNTIME_API_HOST = (import.meta as any).env?.VITE_API_HOST as string | undefined;
    if (!RUNTIME_API_KEY || !RUNTIME_API_HOST) {
      setState(prev => ({ ...prev, errorMessage: "Missing VITE_API_KEY or VITE_API_HOST in .env.local. Please add them and restart the dev server." }));
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, errorMessage: null }));

    try {
      const mockModelMetadata = `
        File: ${state.currentFile.name}
        Size: ${(state.currentFile.size / (1024 * 1024)).toFixed(2)} MB
        Type: STL
        Context: High-density industrial mesh reconstruction.
      `;

      const result = await analyzeMeshFeatures(mockModelMetadata);

      const newHistoryItem: HistoryItem = {
        id: generateId(),
        fileName: state.currentFile.name,
        modelUrl: state.modelUrl,
        analysisResult: result,
        timestamp: Date.now()
      };

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        analysisResult: result,
        history: [newHistoryItem, ...prev.history]
      }));
    } catch (err) {
      console.error(err);
      const message = err && typeof err === 'object' && 'message' in err ? (err as any).message : "Recon-Core failed: Engine timed out during heavy mesh scan.";
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        errorMessage: message
      }));
    }
  };

  const handleSwitchHistory = (item: HistoryItem) => {
    setState(prev => ({
      ...prev,
      modelUrl: item.modelUrl,
      analysisResult: item.analysisResult,
      currentFile: new File([], item.fileName),
      activeFeatureId: null,
      isPreviewing: false,
      errorMessage: null,
      warningMessage: null
    }));
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear all session history?")) {
      state.history.forEach(item => URL.revokeObjectURL(item.modelUrl));
      setState(prev => ({
        ...prev,
        currentFile: null,
        modelUrl: null,
        analysisResult: null,
        activeFeatureId: null,
        isPreviewing: false,
        history: [],
        errorMessage: null,
        warningMessage: null
      }));
    }
  };

  const handleTogglePreview = () => {
    setState(prev => ({ ...prev, isPreviewing: !prev.isPreviewing }));
  };

  const activeFeature = state.analysisResult?.features.find(f => f.id === state.activeFeatureId) || null;
  const isAwaitingAnalysis = state.modelUrl && !state.analysisResult && !state.isAnalyzing;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#09090b]">
      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 z-20 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/20 border border-white/10">
            C
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-zinc-100 uppercase italic">CAD-Recon <span className="text-indigo-500">AI</span></h1>
            <p className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">Industrial Recon System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {state.errorMessage && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold animate-in fade-in slide-in-from-right-2">
              <AlertTriangle size={14} />
              {state.errorMessage}
            </div>
          )}

          {state.warningMessage && !state.errorMessage && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-[10px] font-bold animate-in fade-in slide-in-from-right-2">
              <Info size={14} />
              {state.warningMessage}
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-white/5">
            <div className={`w-2 h-2 rounded-full ${state.isAnalyzing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
              {state.isAnalyzing ? 'Analysis Active' : isAwaitingAnalysis ? 'Awaiting Core' : 'System Ready'}
            </span>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
          >
            <Upload size={14} />
            {state.modelUrl ? 'Swap Mesh' : 'Import Mesh'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".stl"
            className="hidden"
          />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <Sidebar
          features={state.analysisResult?.features || []}
          activeFeatureId={state.activeFeatureId}
          onSelectFeature={(id) => setState(prev => ({ ...prev, activeFeatureId: id }))}
          isAnalyzing={state.isAnalyzing}
          history={state.history}
          currentFileName={state.currentFile?.name || null}
          onSwitchHistory={handleSwitchHistory}
          onClearHistory={handleClearHistory}
        />

        <div className="flex-1 relative">
          {state.modelUrl ? (
            <>
              <CADViewer
                modelUrl={state.modelUrl}
                features={state.analysisResult?.features || []}
                activeFeatureId={state.activeFeatureId}
                isPreviewing={state.isPreviewing}
              />

              {/* Analysis Action Button Overlay */}
              {isAwaitingAnalysis && (
                <div className="absolute inset-x-0 bottom-12 flex justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-2 rounded-[2rem] flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
                    <div className="flex flex-col px-6">
                      <span className="text-[9px] text-indigo-400 font-black tracking-widest uppercase">Input Verified</span>
                      <span className="text-xs text-white font-bold truncate max-w-[150px]">{state.currentFile?.name}</span>
                    </div>
                    <button
                      onClick={handleStartAnalysis}
                      className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-indigo-600/40 group"
                    >
                      <Zap size={18} className="fill-white group-hover:animate-pulse" />
                      <span className="text-sm font-black uppercase tracking-widest italic">Initialize AI Reconstruction</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Scanning indicator when analyzing */}
              {state.isAnalyzing && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-indigo-500/20 to-transparent animate-scan-line"></div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0c0c0e] relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 0)', backgroundSize: '40px 40px' }}
              ></div>

              <div className="z-10 text-center max-w-sm p-10 bg-zinc-900/50 rounded-[2.5rem] border border-white/5 backdrop-blur-xl shadow-2xl">
                <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-indigo-500/20 shadow-inner">
                  <Database className="text-indigo-400" size={32} />
                </div>
                <h2 className="text-xl font-black text-zinc-100 mb-3 uppercase tracking-tight italic underline decoration-indigo-500/50 underline-offset-8">Neural Recon v4</h2>
                <p className="text-zinc-500 text-xs mb-10 leading-relaxed px-4">
                  Convert high-density STL meshes into manufacturing-ready B-Rep geometry.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5"
                >
                  Select .STL File
                </button>
              </div>
            </div>
          )}
        </div>

        <AnalysisPanel
          result={state.analysisResult}
          activeFeature={activeFeature}
          fileName={state.currentFile?.name || null}
          isPreviewing={state.isPreviewing}
          onTogglePreview={handleTogglePreview}
        />
      </main>

      <footer className="h-9 border-t border-white/10 bg-[#09090b] flex items-center justify-between px-6 text-[10px] font-mono text-zinc-500 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            <span className="font-bold">ENGINE: FLASH_LATENCY_OPT</span>
          </div>
          <div className="flex items-center gap-2 border-l border-white/10 pl-6">
            <span className="text-zinc-700">WORKSPACE:</span>
            <span className="text-zinc-400 font-bold uppercase">{state.currentFile?.name || 'VIRTUAL_ROOT'}</span>
          </div>
        </div>
        <div className="flex items-center gap-6 font-bold">
          <span className="text-zinc-800 bg-zinc-900 px-3 py-1 rounded">AUTH_ID: 882-CAD-PRO</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
