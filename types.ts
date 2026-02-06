
export enum CADFeatureType {
  HOLE = 'HOLE',
  FILLET = 'FILLET',
  CHAMFER = 'CHAMFER',
  POCKET = 'POCKET',
  EXTRUSION = 'EXTRUSION',
  REVOLVE = 'REVOLVE',
  SHELL = 'SHELL'
}

export interface CADFeature {
  id: string;
  name: string;
  type: CADFeatureType;
  confidence: number;
  parameters: Record<string, any>;
  status: 'detected' | 'reconstructed' | 'failed';
}

export interface AnalysisResult {
  features: CADFeature[];
  qualityScore: number;
  summary: string;
  reconstructionSteps: string[];
}

export interface HistoryItem {
  id: string;
  fileName: string;
  modelUrl: string;
  analysisResult: AnalysisResult;
  timestamp: number;
}

export interface AppState {
  currentFile: File | null;
  isAnalyzing: boolean;
  isReconstructing: boolean;
  isPreviewing: boolean;
  analysisResult: AnalysisResult | null;
  activeFeatureId: string | null;
  history: HistoryItem[];
}
