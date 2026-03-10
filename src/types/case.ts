export type YishuCase = {
  id: string;
  userId: string;
  paradigm: string;
  paradigmLabel: string;
  question: string;
  location: string;
  currentTime: string;
  result: string;
  model: string;
  reference: string;
  lunarContext?: {
    solarDate: string;
    lunarDate: string;
    ganzhi: string;
  };
  foundations?: Array<{
    id: string;
    name: string;
    purpose: string;
    kind: "engine" | "data" | "workflow";
    license: string;
    integration: "direct" | "reference";
    confidence: number;
  }>;
  engineData?: Record<string, unknown>;
  aiEnhancements?: string[];
  citations: Array<{
    title: string;
    chapter: string;
    quote: string;
    source: string;
  }>;
  createdAt: string;
};
