
export interface SuggestionItem {
  section: string;
  suggestion: string;
  reason: string;
}

export interface ReplacementItem {
  section: string;
  original: string;
  replacement: string;
  reason: string;
}

export interface ScoreBreakdown {
  keywordMatch: number;
  experienceLevel: number;
  skillsMatch: number;
  industryKnowledge: number;
  explanation: string;
}

export interface TailoredSuggestions {
  initialMatchScore: number;
  projectedMatchScore: number;
  scoreBreakdown: ScoreBreakdown;
  additions: SuggestionItem[];
  removals: SuggestionItem[];
  replacements: ReplacementItem[];
}

export interface ScreeningPrepItem {
  question: string;
  answer: string;
  keywords: string[];
}

export interface AnalysisSession {
  name: string;
  timestamp: number; // Used as a unique ID
  suggestions: TailoredSuggestions | null;
  resumeFileName: string | null;
  resumeText: string | null;
  jobDescription: string;
  screeningPrep: ScreeningPrepItem[] | null;
  chatHistory: ChatMessage[] | null;
  coverLetter: string | null;
  isLoadingSuggestions?: boolean;
  isLoadingPrep?: boolean;
  isLoadingCoverLetter?: boolean;
  error?: string | null;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}