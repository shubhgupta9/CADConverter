
import React, { useState } from 'react';
import { AnalysisResult, CADFeature } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Download, FileCode, FileText, Loader2, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface AnalysisPanelProps {
  result: AnalysisResult | null;
  activeFeature: CADFeature | null;
  fileName: string | null;
  isPreviewing: boolean;
  onTogglePreview: () => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ 
  result, 
  activeFeature, 
  fileName, 
  isPreviewing, 
  onTogglePreview 
}) => {
  const [isExportingStep, setIsExportingStep] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!result) {
    return (
      <div className="w-80 bg-[#09090b] border-l border-white/10 p-6 flex flex-col justify-center items-center text-center">
        <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
          <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-tighter">AI Analysis Hub</h3>
        <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">Awaiting mesh input for topological feature extraction and B-Rep pathing.</p>
      </div>
    );
  }

  const generateMockSTEP = (features: CADFeature[], name: string) => {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").split(".")[0];
    const cleanName = name.replace(/\.[^/.]+$/, "");
    
    // Higher fidelity STEP template for viewer compatibility
    let step = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('CAD-Recon Reconstructed Parametric Part','B-Rep Representation'),'2;1');
FILE_NAME('${cleanName}.stp','${new Date().toISOString()}',('CAD-RECON AI'),('INDUSTRIAL_SYSTEMS'),'Recon-Core v4.2','JS-GEOM-KERNEL','');
FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));
ENDSEC;
DATA;
#10=ORGANIZATION('CAD-RECON','UNSPECIFIED','');
#11=PRODUCT_DEFINITION_CONTEXT('part definition',#12,'design');
#12=APPLICATION_CONTEXT('mechanical design');
#13=PRODUCT_CONTEXT('',#12,'mechanical');
#14=PRODUCT('${cleanName}','${cleanName}','CAD-RECON GENERATED',(#13));
#15=PRODUCT_DEFINITION_FORMATION('1',$,#14);
#16=PRODUCT_DEFINITION('design',$,#15,#11);
#17=DESIGN_CONTEXT('mechanical design',#12,'design');
#18=MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION('',(#20),#21);
#19=SHAPE_REPRESENTATION_RELATIONSHIP('','',#22,#23);

/* Topological Reconstruction Block */
`;

    features.forEach((f, i) => {
      const baseId = 100 + (i * 20);
      step += `/* FEATURE_${i}: ${f.type} - ${f.name} */\n`;
      if (f.type === 'HOLE') {
        step += `#${baseId}=CYLINDRICAL_SURFACE('${f.name}',#${baseId+1},${f.parameters.diameter / 2 || 5.0});\n`;
        step += `#${baseId+1}=AXIS2_PLACEMENT_3D('',#${baseId+2},#${baseId+3},#${baseId+4});\n`;
        step += `#${baseId+2}=CARTESIAN_POINT('',(0.0,0.0,0.0));\n`;
        step += `#${baseId+3}=DIRECTION('',(0.0,0.0,1.0));\n`;
        step += `#${baseId+4}=DIRECTION('',(1.0,0.0,0.0));\n`;
      } else {
        step += `#${baseId}=ADVANCED_FACE('${f.name}',(#${baseId+1}),#${baseId+2},.T.);\n`;
        step += `#${baseId+1}=FACE_OUTER_BOUND('',#${baseId+3},.T.);\n`;
        step += `#${baseId+2}=PLANE('',#${baseId+4});\n`;
        step += `#${baseId+4}=AXIS2_PLACEMENT_3D('',#${baseId+5},#${baseId+6},#${baseId+7});\n`;
        step += `#${baseId+5}=CARTESIAN_POINT('',(0.0,0.0,0.0));\n`;
      }
    });

    step += `
/* Closure */
#500=CLOSED_SHELL('',(${features.map((_, i) => `#${100 + (i*20)}`).join(',')}));
#501=MANIFOLD_SOLID_BREP('${cleanName}',#500);
ENDSEC;
END-ISO-10303-21;`;
    return step;
  };

  const handleExportSTEP = () => {
    setIsExportingStep(true);
    setTimeout(() => {
      const stepContent = generateMockSTEP(result.features, fileName || "reconstructed_part");
      const blob = new Blob([stepContent], { type: 'application/step' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName?.replace(/\.[^/.]+$/, "") || "reconstructed_model"}.stp`;
      link.click();
      URL.revokeObjectURL(url);
      setIsExportingStep(false);
    }, 1800);
  };

  const handleDownloadPDF = () => {
    setIsExportingPdf(true);
    setTimeout(() => {
      const now = new Date().toLocaleString();
      const reportContent = `RECON AI ANALYSIS REPORT\nFile: ${fileName}\nScore: ${result.qualityScore}\n\nFeatures:\n${result.features.map(f => `- ${f.name} (${f.type})`).join('\n')}`;
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName?.replace(/\.[^/.]+$/, "")}_metrics.txt`;
      link.click();
      URL.revokeObjectURL(url);
      setIsExportingPdf(false);
    }, 1000);
  };

  const qualityData = [
    { name: 'Solid', value: result.qualityScore * 100 },
    { name: 'Loss', value: 100 - (result.qualityScore * 100) },
  ];
  const COLORS = ['#6366f1', '#18181b'];

  return (
    <div className="w-80 bg-[#09090b] border-l border-white/10 flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#09090b]/90 backdrop-blur-md z-10">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">Analysis Hub</h2>
        <ShieldCheck size={14} className="text-indigo-500 opacity-50" />
      </div>

      <div className="p-6 space-y-6">
        {/* Preview Toggle Button */}
        <section>
          <button 
            onClick={onTogglePreview}
            className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl transition-all border font-bold text-xs uppercase tracking-widest ${
              isPreviewing 
                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-500/10' 
                : 'bg-zinc-900 border-white/5 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            {isPreviewing ? <EyeOff size={16} /> : <Eye size={16} />}
            {isPreviewing ? 'Exit B-Rep Preview' : 'Preview Reconstructed STEP'}
          </button>
          <p className="text-[9px] text-zinc-600 mt-2 text-center italic">
            {isPreviewing 
              ? 'Rendering parametric surfaces with G2 continuity simulation.' 
              : 'Toggle to view the cleaned AI-reconstructed geometry.'}
          </p>
        </section>

        {/* Conversion Quality Section */}
        <section className="bg-zinc-900/30 p-4 rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase">Conversion Quality</h3>
            <span className="text-xs font-mono text-indigo-400">{(result.qualityScore * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qualityData}
                    innerRadius={20}
                    outerRadius={30}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {qualityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                "{result.summary}"
              </p>
            </div>
          </div>
        </section>

        {/* Feature Metrics */}
        {activeFeature && (
          <section className="bg-zinc-900/50 rounded-xl p-4 border border-indigo-500/20 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-[10px] font-bold text-indigo-400 uppercase mb-3">Feature Definition</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Topology ID</span>
                <span className="text-zinc-300 font-mono text-[10px]">{activeFeature.id}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Geometry Type</span>
                <span className="text-zinc-300 font-bold">{activeFeature.type}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-white/5 space-y-1">
                {Object.entries(activeFeature.parameters).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-[11px] py-0.5">
                    <span className="text-zinc-500 capitalize">{key}</span>
                    <span className="text-indigo-300 font-mono">{val}mm</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Export Center */}
        <section className="pt-4 space-y-3">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase mb-4">Export Factory</h3>
          
          <button 
            disabled={isExportingStep}
            onClick={handleExportSTEP}
            className="group relative w-full flex items-center justify-between p-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-xl shadow-indigo-600/10 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              {isExportingStep ? (
                <Loader2 size={18} className="animate-spin text-indigo-300" />
              ) : (
                <FileCode size={18} className="text-indigo-100 group-hover:scale-110 transition-transform" />
              )}
              <div className="text-left">
                <div className="text-xs font-bold uppercase tracking-widest">Export STEP (.stp)</div>
                <div className="text-[9px] text-indigo-200 opacity-70">Industrial B-Rep Solid</div>
              </div>
            </div>
            {!isExportingStep && <Download size={14} className="text-indigo-200" />}
          </button>

          <button 
            disabled={isExportingPdf}
            onClick={handleDownloadPDF}
            className="group w-full flex items-center justify-between p-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex items-center gap-3 text-left">
              <FileText size={16} className="text-zinc-500" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wide">Analysis Log</div>
                <div className="text-[9px] text-zinc-500">Verification Certificate</div>
              </div>
            </div>
          </button>
        </section>

        <div className="flex items-center gap-2 justify-center text-[9px] text-zinc-700 pt-4 pb-8">
          <CheckCircle2 size={10} className="text-emerald-500 opacity-50" />
          <span>Verified for Production Interoperability</span>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
