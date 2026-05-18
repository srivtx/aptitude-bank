export interface Question {
  id: string;
  topic: string;
  subtopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  company_tags: string[];
  passage?: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  shortcut: string;
  formula_used: string;
  trap_type: string;
  source: string;
  source_url: string;
  pattern_detected: string;
}

export interface TopicMetadata {
  topic: string;
  subtopic: string;
  total_questions: number;
  sources: string[];
  last_updated: string;
}

export interface TopicData {
  metadata: TopicMetadata;
  questions: Question[];
}

export interface TopicIndex {
  generated_at: string;
  total_topics: number;
  total_questions: number;
  total_company_questions: number;
  total_patterns: number;
  categories: {
    quant: number;
    reasoning: number;
    verbal: number;
  };
  topics: {
    id: string;
    name: string;
    category: string;
    total_questions: number;
    difficulty_distribution: {
      easy: number;
      medium: number;
      hard: number;
    };
    sources: string[];
  }[];
}

export interface Pattern {
  pattern_id: string;
  name: string;
  template: string;
  subtopic: string;
  difficulty: string;
  formula: string;
  shortcut: string;
  example_ids: string[];
  frequency: string;
  companies: string[];
}

export interface PatternsData {
  metadata: {
    topic: string;
    description: string;
    last_updated: string;
    total_patterns: number;
  };
  patterns: Pattern[];
}
