
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
  Zap,
  Sun,
  Moon
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
  theme: 'dark' | 'light';
}

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
    warningMessage: null,
    theme: 'dark'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      state.history.forEach(item => URL.revokeObjectURL(item.modelUrl));
    };
  }, []);

  const toggleTheme = () => {
    setState(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  const handleSelectFeature = (id: string | null) => {
    setState(prev => ({ 
      ...prev, 
      activeFeatureId: prev.activeFeatureId === id ? null : id 
    }));
  };

  const validateFile = async (file: File): Promise<{ error: string | null; warning: string | null }> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'stl') {
      return { error: "Unsupported format. Only industrial .STL mesh files are accepted.", warning: null };
    }

    const MAX_SIZE = 150 * 1024 * 1024;
    const WARNING_SIZE = 50 * 1024 * 1024;
    
    if (file.size > MAX_SIZE) {
      return { error: "File exceeds 150MB platform limit.", warning: null };
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
      if (first5.toLowerCase() === 'solid') return { error: null, warning };

      const dataView = new DataView(buffer);
      const facetCount = dataView.getUint32(80, true);
      const expectedSize = 84 + (facetCount * 50);
      
      if (facetCount > 10000000) return { error: "Extreme density mesh (>10M facets) rejected.", warning: null };
      if (Math.abs(expectedSize - file.size) > 1024 * 1024) return { error: "Corrupted Binary STL: Inconsistent size.", warning: null };
    } catch (e) {
      return { error: "Header parsing failed.", warning: null };
    }

    return { error: null, warning };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const { error, warning } = await validateFile(file);
    if (error) {
      setState(prev => ({ ...prev, errorMessage: error, warningMessage: null }));
      return;
    }

    const newUrl = URL.createObjectURL(file);
    setState(prev => ({ 
      ...prev, 
      currentFile: file, 
      modelUrl: newUrl,
      isAnalyzing: false,
      analysisResult: null,
      activeFeatureId: null,
      errorMessage: null,
      warningMessage: warning
    }));
  };

  const handleStartAnalysis = async () => {
    if (!state.currentFile || !state.modelUrl) return;
    setState(prev => ({ ...prev, isAnalyzing: true, errorMessage: null }));

    try {
      const mockModelMetadata = `File: ${state.currentFile.name}, Size: ${(state.currentFile.size / (1024 * 1024)).toFixed(2)} MB`;
      const result = await analyzeMeshFeatures(mockModelMetadata);
      
      const newHistoryItem: HistoryItem = {
        id: crypto.randomUUID(),
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
      setState(prev => ({ ...prev, isAnalyzing: false, errorMessage: "Recon-Core failed: Engine timeout." }));
    }
  };

  const handleSwitchHistory = (item: HistoryItem) => {
    setState(prev => ({
      ...prev,
      modelUrl: item.modelUrl,
      analysisResult: item.analysisResult,
      currentFile: new File([], item.fileName),
      activeFeatureId: null,
      errorMessage: null,
      warningMessage: null
    }));
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear all session history?")) {
      state.history.forEach(item => URL.revokeObjectURL(item.modelUrl));
      setState(prev => ({ ...prev, history: [] }));
    }
  };

  const isDark = state.theme === 'dark';
  const themeClasses = isDark ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-50 text-zinc-900';
  const borderClass = isDark ? 'border-white/10' : 'border-zinc-200';
  const headerBg = isDark ? 'bg-[#09090b]/80' : 'bg-white/80';
  const activeFeature = state.analysisResult?.features.find(f => f.id === state.activeFeatureId) || null;
  const isAwaitingAnalysis = state.modelUrl && !state.analysisResult && !state.isAnalyzing;

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${themeClasses}`}>
      <header className={`h-14 border-b ${borderClass} flex items-center justify-between px-6 z-20 ${headerBg} backdrop-blur-xl`}>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-700/20 border border-white/10">
            C
          </div>
          <div>
            <h1 className={`text-sm font-black tracking-tight uppercase italic ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
              CAD-Recon <span className="text-blue-600">AI</span>
            </h1>
            <p className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">Industrial Recon System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-600'}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {state.errorMessage && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold">
              <AlertTriangle size={14} /> {state.errorMessage}
            </div>
          )}

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isDark ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200'}`}>
            <div className={`w-2 h-2 rounded-full ${state.isAnalyzing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
              {state.isAnalyzing ? 'Analysis Active' : isAwaitingAnalysis ? 'Awaiting Core' : 'System Ready'}
            </span>
          </div>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 shadow-xl shadow-blue-700/20"
          >
            <Upload size={14} />
            {state.modelUrl ? 'Swap Mesh' : 'Import Mesh'}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".stl" className="hidden" />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <Sidebar 
          features={state.analysisResult?.features || []} 
          activeFeatureId={state.activeFeatureId}
          onSelectFeature={handleSelectFeature}
          isAnalyzing={state.isAnalyzing}
          history={state.history}
          currentFileName={state.currentFile?.name || null}
          onSwitchHistory={handleSwitchHistory}
          onClearHistory={handleClearHistory}
          theme={state.theme}
        />

        <div className="flex-1 relative bg-zinc-100 dark:bg-zinc-900">
           {state.modelUrl ? (
             <>
               <CADViewer 
                 modelUrl={state.modelUrl}
                 features={state.analysisResult?.features || []} 
                 activeFeatureId={state.activeFeatureId}
                 onSelectFeature={handleSelectFeature}
                 isPreviewing={state.isPreviewing}
                 theme={state.theme}
               />
               
               {isAwaitingAnalysis && (
                 <div className="absolute inset-x-0 bottom-12 flex justify-center pointer-events-none">
                    <div className={`${isDark ? 'bg-black/40 border-white/10' : 'bg-white/70 border-zinc-200'} backdrop-blur-2xl border p-2 rounded-[2rem] flex items-center gap-4 shadow-2xl pointer-events-auto`}>
                      <div className="flex flex-col px-6">
                        <span className="text-[9px] text-blue-600 font-black tracking-widest uppercase">Input Verified</span>
                        <span className={`text-xs font-bold truncate max-w-[150px] ${isDark ? 'text-white' : 'text-zinc-900'}`}>{state.currentFile?.name}</span>
                      </div>
                      <button 
                        onClick={handleStartAnalysis}
                        className="flex items-center gap-3 px-8 py-4 bg-blue-700 hover:bg-blue-600 text-white rounded-[1.5rem] transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-blue-700/40 group"
                      >
                        <Zap size={18} className="fill-white group-hover:animate-pulse" />
                        <span className="text-sm font-black uppercase tracking-widest italic">Initialize AI Reconstruction</span>
                      </button>
                    </div>
                 </div>
               )}

               {state.isAnalyzing && (
                 <div className="absolute inset-0 pointer-events-none overflow-hidden">
                   <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-blue-500/20 to-transparent animate-scan-line"></div>
                 </div>
               )}
             </>
           ) : (
             <div className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden ${isDark ? 'bg-[#0c0c0e]' : 'bg-zinc-100'}`}>
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                  style={{ backgroundImage: `radial-gradient(${isDark ? '#3b82f6' : '#1d4ed8'} 1px, transparent 0)`, backgroundSize: '40px 40px' }}
                ></div>

                <div className={`z-10 text-center max-w-sm p-10 rounded-[2.5rem] border backdrop-blur-xl shadow-2xl ${isDark ? 'bg-zinc-900/50 border-white/5' : 'bg-white/80 border-zinc-200'}`}>
                  <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-blue-500/20 shadow-inner">
                    <Database className="text-blue-600" size={32} />
                  </div>
                  <h2 className={`text-xl font-black mb-3 uppercase tracking-tight italic underline decoration-blue-500/50 underline-offset-8 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Neural Recon v4</h2>
                  <p className="text-zinc-500 text-xs mb-10 leading-relaxed px-4">
                    Convert high-density STL meshes into manufacturing-ready B-Rep geometry.
                  </p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full py-4 font-black uppercase text-xs tracking-widest rounded-2xl transition-all active:scale-95 shadow-xl ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-blue-700 text-white hover:bg-blue-800'}`}
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
          onTogglePreview={() => setState(p => ({ ...p, isPreviewing: !p.isPreviewing }))}
          theme={state.theme}
        />
      </main>

      <footer className={`h-9 border-t flex items-center justify-between px-6 text-[10px] font-mono text-zinc-500 z-20 ${isDark ? 'bg-[#09090b] border-white/10' : 'bg-zinc-100 border-zinc-200'}`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            <span className="font-bold">ENGINE: FLASH_LATENCY_OPT</span>
          </div>
          <div className={`flex items-center gap-2 border-l pl-6 ${isDark ? 'border-white/10' : 'border-zinc-200'}`}>
            <span className="text-zinc-400">WORKSPACE:</span>
            <span className={`font-bold uppercase ${isDark ? 'text-zinc-400' : 'text-zinc-700'}`}>{state.currentFile?.name || 'VIRTUAL_ROOT'}</span>
          </div>
        </div>
        <div className="flex items-center gap-6 font-bold uppercase">
           <span className={`${isDark ? 'text-zinc-700 bg-zinc-900' : 'text-zinc-400 bg-white'} px-3 py-1 rounded`}>AUTH_ID: 882-CAD-PRO</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
