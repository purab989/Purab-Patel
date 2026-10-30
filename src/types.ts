export interface PolicyTranslation {
  languageCode: string;
  languageName: string;
  question: string;
  answer: string;
}

export interface Policy {
  id: string;
  category: 'wages' | 'shifts' | 'safety' | 'benefits' | 'complaints' | 'leave';
  categoryLabel: string;
  title: string;
  canonicalQuestion: string;
  canonicalAnswer: string;
  translations: Record<string, PolicyTranslation>;
  lastUpdated: string;
  updatedBy: string;
  version: number;
  changeLog: { version: number; date: string; user: string; note: string }[];
}

export interface QueryLog {
  id: string;
  workerId: string;
  timestamp: string;
  channel: 'whatsapp' | 'web_kiosk' | 'voice_kiosk';
  language: string;
  questionText: string;
  answerText: string;
  topic: string;
  subtopic: string;
  followupCount: number;
  feedback: 'helpful' | 'confused' | null;
  factory: string;
  shift: 'Morning' | 'Evening' | 'Night';
  audioUsed: boolean;
}

export interface TopicMetric {
  topic: string;
  label: string;
  queryCount: number;
  uniqueWorkers: number;
  avgFollowups: number;
  helpfulRatio: number;
  confusionScore: number;
  status: 'severe' | 'moderate' | 'healthy';
  languages: Record<string, number>;
  sampleQuestions: string[];
  suggestedAction: string;
}

export interface ConfusionMetrics {
  totalQueries: number;
  topics: TopicMetric[];
  languageCounts: Record<string, number>;
  channelCounts: {
    whatsapp: number;
    web_kiosk: number;
    voice_kiosk: number;
  };
  voiceSharePercentage: number;
  mostConfusingTopic: TopicMetric | null;
  overallConfusionAverage: number;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  sampleGreeting: string;
}
