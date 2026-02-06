
import React, { useState, useEffect } from 'react';
import { CADFeature, CADFeatureType, HistoryItem } from '../types';
import { Layers, Clock, Box, ChevronRight, HardDrive, Trash2, Cpu, Zap } from 'lucide-react';

interface SidebarProps {
  features: CADFeature[];
  activeFeatureId: string | null;
  onSelectFeature: (id: string) => void;
  isAnalyzing: boolean;
  history: HistoryItem[];
  currentFileName: string | null;
  onSwitchHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  features, 
  activeFeatureId, 
  onSelectFeature, 
  isAnalyzing,
  history,
  currentFileName,
  onSwitchHistory,
  onClearHistory
}) => {
  const [activeTab, setActiveTab] = useState<'features' | 'history'>('features');
  const [loadingPhase, setLoadingPhase] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      setLoadingPhase(1);
      interval = setInterval(() => {
        setLoadingPhase(p => (p < 3 ? p + 1 : p));
      }, 800);
    } else {
      setLoadingPhase(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const getIcon = (type: CADFeatureType) => {
    switch(type) {
      case CADFeatureType.HOLE: return '⚪';
      case CADFeatureType.FILLET: return '⌒';
      case CADFeatureType.POCKET: return '◻';
      case CADFeatureType.EXTRUSION: return '⤴';
      case CADFeatureType.CHAMFER: return '◿';
      default: return '◈';
    }
  };

  const phases = ["INIT_CORE", "MESH_SCAN", "TOPO_RESOLVE", "READY"];

  return (
    <div className="w-72 bg-[#09090b] border-r border-white/10 flex flex-col h-full z-10">
      {/* Tab Switcher */}
      <div className="p-3 border-b border-white/10 flex gap-2">
        <button 
          onClick={() => setActiveTab('features')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all border ${
            activeTab === 'features' 
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
              : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          }`}
        >
          <Layers size={14} />
          Features
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all border ${
            activeTab === 'history' 
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
              : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          }`}
        >
          <Clock size={14} />
          History
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'features' ? (
          <>
            {isAnalyzing ? (
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                  <div className="w-12 h-12 border-2 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                  <Cpu size={16} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] animate-pulse">
                    {phases[loadingPhase]}
                  </p>
                  <p className="text-[9px] text-zinc-600 font-mono uppercase italic">
                    Optimizing Mesh Data...
                  </p>
                </div>
              </div>
            ) : features.length === 0 ? (
              <div className="p-12 text-center text-zinc-600 text-[10px] font-mono uppercase italic tracking-widest opacity-50">
                Awaiting input...
              </div>
            ) : (
              <div className="p-3 space-y-1">
                <div className="px-3 py-2 flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5 mb-3">
                  <Box size={10} />
                  {currentFileName || "LOCAL_CACHE"}
                </div>
                {features.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => onSelectFeature(feature.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] transition-all group border ${
                      activeFeatureId === feature.id 
                        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/40 shadow-lg shadow-indigo-500/5' 
                        : 'text-zinc-400 bg-zinc-900/40 border-transparent hover:border-white/10 hover:bg-zinc-800/40'
                    }`}
                  >
                    <span className="text-xs opacity-70 bg-black/40 w-6 h-6 flex items-center justify-center rounded-lg">{getIcon(feature.type)}</span>
                    <span className="flex-1 text-left font-bold tracking-tight">{feature.name}</span>
                    <div className="flex items-center gap-2">
                       <span className={`text-[8px] font-black ${activeFeatureId === feature.id ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-zinc-500'}`}>
                         {(feature.confidence * 100).toFixed(0)}%
                       </span>
                       <ChevronRight size={12} className={`transition-transform duration-300 ${activeFeatureId === feature.id ? 'rotate-90 text-indigo-400' : 'text-zinc-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-1'}`} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="p-3 space-y-1">
             <div className="px-3 py-2 flex items-center justify-between text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5 mb-3">
              <span>Session History</span>
              {history.length > 0 && (
                <button 
                  onClick={onClearHistory}
                  className="p-1.5 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                  title="Purge session memory"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="p-12 text-center text-zinc-600 text-[10px] font-mono uppercase italic tracking-widest opacity-50">
                Empty archive.
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSwitchHistory(item)}
                  className={`w-full group p-4 rounded-2xl border transition-all text-left mb-2 ${
                    currentFileName === item.fileName 
                      ? 'bg-indigo-500/5 border-indigo-500/30 text-indigo-300 ring-1 ring-indigo-500/10' 
                      : 'bg-zinc-900/60 border-white/5 text-zinc-500 hover:border-white/20 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-black truncate max-w-[140px] tracking-tight">{item.fileName}</span>
                    <span className="text-[8px] font-mono opacity-50 bg-black/40 px-1.5 py-0.5 rounded uppercase">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] font-mono opacity-60">
                    <span className="flex items-center gap-1.5">
                      <Zap size={10} className="text-amber-500" /> {item.analysisResult.features.length} FEATURES
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> {(item.analysisResult.qualityScore * 100).toFixed(0)}% MATCH
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="p-4 bg-zinc-900/80 border-t border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3 px-1">
           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Core Status</span>
           <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${isAnalyzing ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : features.length > 0 ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
            {isAnalyzing ? 'FLASH_LITE_ACTIVE' : features.length > 0 ? 'GEOM_SYNCED' : 'STANDBY'}
           </span>
        </div>
        <div className="space-y-2">
           <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.6)] transition-all duration-1000 ease-out ${isAnalyzing ? 'w-2/3 animate-pulse' : features.length > 0 ? 'w-full' : 'w-0'}`}
              ></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
