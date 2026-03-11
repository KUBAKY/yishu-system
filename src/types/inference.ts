export type AnalysisMode = "event" | "natal" | "forecast" | "relationship" | "travel" | "fengshui_space";
export type ForecastWindow = "3m" | "1y";
export type ReportView = "overview" | "evidence" | "action" | "risk" | "full";
export type Step = 1 | 2 | 3;

export type FoundationModule = {
  id: string;
  name: string;
  purpose: string;
  kind: "engine" | "data" | "workflow";
  license: string;
  integration: "direct" | "reference";
  confidence: number;
};

export interface InferenceResponse {
  result: string;
  meta: {
    paradigm: string;
    paradigmLabel: string;
    analysisMode?: AnalysisMode;
    forecastWindow?: ForecastWindow;
    angles?: string[];
    model: string;
    reference: string;
    citations: Array<{
      title: string;
      chapter: string;
      quote: string;
      source: string;
    }>;
    lunarContext?: {
      solarDate: string;
      lunarDate: string;
      ganzhi: string;
    };
    foundations?: FoundationModule[];
    aiEnhancements?: string[];
  };
}

export interface ResultSections {
  overview: string;
  evidence: string;
  action: string;
  risk: string;
}
