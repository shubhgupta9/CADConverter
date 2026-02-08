
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
  theme: 'dark' | 'light';
}

const Sidebar: React.FC<SidebarProps> = ({ 
  features, 
  activeFeatureId, 
  onSelectFeature, 
  isAnalyzing,
  history,
  currentFileName,
  onSwitchHistory,
  onClearHistory,
  theme
}) => {
  const [activeTab, setActiveTab] = useState<'features' | 'history'>('features');
  const isDark = theme === 'dark';
  const borderClass = isDark ? 'border-white/10' : 'border-zinc-200';
  const bgClass = isDark ? 'bg-[#09090b]' : 'bg-white';

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

  return (
    <div className={`w-72 border-r flex flex-col h-full z-10 transition-colors duration-300 ${bgClass} ${borderClass}`}>
      <div className={`p-3 border-b flex gap-2 ${borderClass}`}>
        <button 
          onClick={() => setActiveTab('features')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all border ${
            activeTab === 'features' 
              ? 'bg-blue-600/10 border-blue-600/30 text-blue-600 shadow-md' 
              : `border-transparent text-zinc-500 hover:text-zinc-800 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`
          }`}
        >
          <Layers size={14} />
          Features
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all border ${
            activeTab === 'history' 
              ? 'bg-blue-600/10 border-blue-600/30 text-blue-600 shadow-md' 
              : `border-transparent text-zinc-500 hover:text-zinc-800 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`
          }`}
        >
          <Clock size={14} />
          History
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'features' ? (
          <div className="p-3 space-y-1">
            {isAnalyzing ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] animate-pulse">Scanning Mesh...</p>
              </div>
            ) : features.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-[10px] font-mono uppercase italic opacity-50">Awaiting input...</div>
            ) : (
              features.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => onSelectFeature(feature.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] transition-all group border ${
                    activeFeatureId === feature.id 
                      ? 'bg-blue-600/10 text-blue-800 border-blue-600/40 shadow-lg' 
                      : `text-zinc-500 border-transparent ${isDark ? 'bg-zinc-900/40 hover:bg-zinc-800' : 'bg-zinc-100 hover:bg-zinc-200'}`
                  }`}
                >
                  <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-lg ${isDark ? 'bg-black/40' : 'bg-white/80'}`}>{getIcon(feature.type)}</span>
                  <span className={`flex-1 text-left font-bold ${activeFeatureId === feature.id ? 'text-blue-900' : ''}`}>{feature.name}</span>
                  <ChevronRight size={12} className={`transition-all ${activeFeatureId === feature.id ? 'rotate-90 text-blue-600' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="p-3 space-y-1">
             <div className={`px-3 py-2 flex items-center justify-between text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b mb-3 ${borderClass}`}>
              <span>Archive</span>
              {history.length > 0 && (
                <button onClick={onClearHistory} className="p-1.5 hover:text-red-600 transition-colors"><Trash2 size={12} /></button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-[10px] font-mono uppercase opacity-50">Empty.</div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSwitchHistory(item)}
                  className={`w-full group p-4 rounded-2xl border transition-all text-left mb-2 ${
                    currentFileName === item.fileName 
                      ? 'bg-blue-600/5 border-blue-600/30 text-blue-700' 
                      : `border-transparent ${isDark ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-zinc-50 hover:bg-zinc-100'}`
                  }`}
                >
                  <span className="text-[11px] font-black block mb-1">{item.fileName}</span>
                  <div className="flex items-center gap-4 text-[9px] opacity-60">
                    <span className="flex items-center gap-1.5"><Zap size={10} className="text-amber-500" /> {item.analysisResult.features.length} FEATURES</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className={`p-4 border-t backdrop-blur-xl ${isDark ? 'bg-zinc-900/80' : 'bg-zinc-50'} ${borderClass}`}>
        <div className="flex items-center justify-between mb-3 px-1">
           <span className="text-[10px] font-black text-zinc-500 uppercase">Core Status</span>
           <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${isAnalyzing ? 'bg-amber-500/10 text-amber-600 border-amber-500' : 'bg-blue-600/10 text-blue-600 border-blue-600'}`}>
            {isAnalyzing ? 'ACTIVE' : 'READY'}
           </span>
        </div>
        <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
          <div className={`h-full bg-blue-700 transition-all duration-1000 ${isAnalyzing ? 'w-2/3 animate-pulse' : features.length > 0 ? 'w-full' : 'w-0'}`}></div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
