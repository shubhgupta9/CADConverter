
import React, { useState } from 'react';
import { AnalysisResult, CADFeature } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
// Added Database to the imports from lucide-react
import { Download, FileCode, FileText, Loader2, CheckCircle2, ShieldCheck, Eye, EyeOff, Database } from 'lucide-react';

interface AnalysisPanelProps {
  result: AnalysisResult | null;
  activeFeature: CADFeature | null;
  fileName: string | null;
  isPreviewing: boolean;
  onTogglePreview: () => void;
  theme: 'dark' | 'light';
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ 
  result, 
  activeFeature, 
  fileName, 
  isPreviewing, 
  onTogglePreview,
  theme
}) => {
  const isDark = theme === 'dark';
  const borderClass = isDark ? 'border-white/10' : 'border-zinc-200';
  const bgClass = isDark ? 'bg-[#09090b]' : 'bg-white';
  const accentColor = "#1d4ed8"; // Dark Blue

  if (!result) {
    return (
      <div className={`w-80 border-l p-6 flex flex-col justify-center items-center text-center transition-colors duration-300 ${bgClass} ${borderClass}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 border ${isDark ? 'bg-zinc-900 border-white/5' : 'bg-zinc-100 border-zinc-200'}`}>
          <Database size={24} className="text-zinc-500" />
        </div>
        <h3 className="text-sm font-medium uppercase tracking-tighter">AI Analysis Hub</h3>
        <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">Awaiting topological feature extraction scan.</p>
      </div>
    );
  }

  const qualityData = [{ value: result.qualityScore * 100 }, { value: 100 - (result.qualityScore * 100) }];
  const COLORS = [accentColor, isDark ? '#18181b' : '#e2e8f0'];

  return (
    <div className={`w-80 border-l flex flex-col h-full overflow-y-auto transition-colors duration-300 ${bgClass} ${borderClass}`}>
      <div className={`p-4 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-10 ${bgClass}/90 ${borderClass}`}>
        <h2 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">Analysis Hub</h2>
        <ShieldCheck size={14} className="text-blue-700 opacity-50" />
      </div>

      <div className="p-6 space-y-6">
        <button 
          onClick={onTogglePreview}
          className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl transition-all border font-bold text-xs uppercase tracking-widest ${
            isPreviewing 
              ? 'bg-blue-600/10 border-blue-600/50 text-blue-700 shadow-lg' 
              : `bg-zinc-900 border-transparent text-white hover:bg-zinc-800 ${!isDark && 'bg-blue-700 text-white hover:bg-blue-800'}`
          }`}
        >
          {isPreviewing ? <EyeOff size={16} /> : <Eye size={16} />}
          {isPreviewing ? 'Exit B-Rep Preview' : 'Preview STEP Model'}
        </button>

        <section className={`p-4 rounded-xl border ${isDark ? 'bg-zinc-900/30 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase">Recon Accuracy</h3>
            <span className="text-xs font-mono text-blue-700">{(result.qualityScore * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={qualityData} innerRadius={20} outerRadius={30} dataKey="value" stroke="none">
                  {qualityData.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie></PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed italic flex-1">"{result.summary}"</p>
          </div>
        </section>

        {activeFeature && (
          <section className={`rounded-xl p-4 border animate-in fade-in slide-in-from-right-4 ${isDark ? 'bg-zinc-900/50 border-blue-600/20' : 'bg-blue-50 border-blue-800/20'}`}>
            <h3 className="text-[10px] font-bold text-blue-700 uppercase mb-3">Feature Definition</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-zinc-500">Geometry Type</span><span className="font-bold">{activeFeature.type}</span></div>
              <div className="pt-2 mt-2 border-t border-black/5 space-y-1">
                {Object.entries(activeFeature.parameters).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[11px]">
                    <span className="text-zinc-500 capitalize">{k}</span>
                    <span className="text-blue-800 font-mono font-bold">{v}mm</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="pt-4 space-y-3">
          <button className="w-full flex items-center justify-between p-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl transition-all shadow-xl active:scale-95">
            <div className="flex items-center gap-3">
              <FileCode size={18} />
              <div className="text-left"><div className="text-xs font-bold uppercase tracking-widest">Export STEP</div><div className="text-[9px] opacity-70">Industrial B-Rep Solid</div></div>
            </div>
            <Download size={14} />
          </button>
          <button className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isDark ? 'bg-zinc-900 border-white/10 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600'}`}>
            <div className="flex items-center gap-3 text-left">
              <FileText size={16} className="text-zinc-500" />
              <div><div className="text-xs font-bold uppercase">Analysis Log</div><div className="text-[9px] text-zinc-500">Industrial Certificate</div></div>
            </div>
          </button>
        </section>
      </div>
    </div>
  );
};

export default AnalysisPanel;
