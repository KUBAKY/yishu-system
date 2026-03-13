export type InferencePayload = {
  paradigm?: string;
  analysisMode?: "event" | "natal" | "forecast" | "relationship" | "travel" | "fengshui_space" | "naming";
  forecastWindow?: "3m" | "1y";
  angles?: string[];
  question?: string;
  currentTime?: string;
  location?: string;
  namingContext?: {
    child?: {
      gender?: string;
      birthDate?: string;
      birthTime?: string;
      birthLocation?: string;
    };
    father?: {
      name?: string;
      gender?: string;
      birthDate?: string;
      birthTime?: string;
    };
    mother?: {
      name?: string;
      gender?: string;
      birthDate?: string;
      birthTime?: string;
    };
    preferences?: {
      nameLengths?: number[];
      styles?: string[];
      otherStyle?: string;
      mustIncludeChars?: string;
      avoidChars?: string;
      notes?: string;
    };
  };
  profile?: {
    name?: string;
    gender?: string;
    birthDate?: string;
    birthTime?: string;
    birthLocation?: string;
    currentResidence?: string;
    pastResidences?: string;
    experienceNarrative?: string;
    currentStatus?: string;
    futureVision?: string;
  };
  eventContext?: {
    background?: string;
    urgency?: string;
    horizon?: string;
    mood?: string;
  };
  attachments?: Array<{
    name?: string;
    type?: string;
    dataUrl?: string;
    note?: string;
    category?: string;
  }>;
};

export type ParadigmSpec = {
  label: string;
  reasoningFrame: string;
  reference: string;
};

export type OpenRouterChoice = {
  message?: {
    content?: string | Array<{ type?: string; text?: string; image_url?: { url: string } }>;
  };
};

export type OpenRouterResponse = {
  choices?: OpenRouterChoice[];
  model?: string;
  error?: {
    message?: string;
  };
};
