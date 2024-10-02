import { create } from "zustand";

interface AnalysisState {
  analysisResult: Record<string, any> | null;
  loading: boolean;
  setAnalysisResult: (result: Record<string, any>) => void;
  setLoading: (state: boolean) => void;
}

export const useAnalysis = create<AnalysisState>((set) => ({
  analysisResult: null,
  loading: false,
  setAnalysisResult: (result) => set({ analysisResult: result }),
  setLoading: (state) => set({ loading: state }),
}));
