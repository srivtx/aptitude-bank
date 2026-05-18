export interface MockConfig {
  id: string;
  name: string;
  description: string;
  totalQuestions: number;
  totalMinutes: number;
  sections: MockSection[];
  negativeMarking: boolean;
  allowsSwitching: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface MockSection {
  id: string;
  name: string;
  questionCount: number;
  minutes: number;
  topicPool: { subtopic: string; category: string; weight: number }[];
}

export const MOCK_CONFIGS: MockConfig[] = [
  {
    id: 'tcs-nqt',
    name: 'TCS NQT Foundation',
    description: '65 questions, 75 minutes. Numerical + Verbal + Reasoning. No negative marking. No section switching.',
    totalQuestions: 65,
    totalMinutes: 75,
    negativeMarking: false,
    allowsSwitching: false,
    difficulty: 'medium',
    sections: [
      {
        id: 'quant',
        name: 'Numerical Ability',
        questionCount: 20,
        minutes: 25,
        topicPool: [
          { subtopic: 'percentages', category: 'quant', weight: 2 },
          { subtopic: 'profit_loss', category: 'quant', weight: 2 },
          { subtopic: 'time_speed_distance', category: 'quant', weight: 2 },
          { subtopic: 'time_work', category: 'quant', weight: 2 },
          { subtopic: 'number_system', category: 'quant', weight: 2 },
          { subtopic: 'hcf_lcm', category: 'quant', weight: 1 },
          { subtopic: 'ratios_proportions', category: 'quant', weight: 2 },
          { subtopic: 'averages', category: 'quant', weight: 1 },
          { subtopic: 'ages', category: 'quant', weight: 1 },
          { subtopic: 'pipes_cisterns', category: 'quant', weight: 1 },
          { subtopic: 'mixtures_alligations', category: 'quant', weight: 1 },
          { subtopic: 'bar_charts', category: 'quant', weight: 1 },
          { subtopic: 'pie_charts', category: 'quant', weight: 1 },
          { subtopic: 'mensuration', category: 'quant', weight: 1 },
          { subtopic: 'simple_interest', category: 'quant', weight: 1 },
          { subtopic: 'divisibility', category: 'quant', weight: 1 },
        ]
      },
      {
        id: 'verbal',
        name: 'Verbal Ability',
        questionCount: 25,
        minutes: 25,
        topicPool: [
          { subtopic: 'reading_comprehension', category: 'verbal', weight: 5 },
          { subtopic: 'error_spotting', category: 'verbal', weight: 4 },
          { subtopic: 'sentence_correction', category: 'verbal', weight: 4 },
          { subtopic: 'para_jumbles', category: 'verbal', weight: 3 },
          { subtopic: 'fill_blanks', category: 'verbal', weight: 3 },
          { subtopic: 'grammar', category: 'verbal', weight: 3 },
          { subtopic: 'synonyms', category: 'verbal', weight: 2 },
          { subtopic: 'antonyms', category: 'verbal', weight: 1 },
        ]
      },
      {
        id: 'reasoning',
        name: 'Reasoning Ability',
        questionCount: 20,
        minutes: 25,
        topicPool: [
          { subtopic: 'series', category: 'reasoning', weight: 5 },
          { subtopic: 'coding_decoding', category: 'reasoning', weight: 3 },
          { subtopic: 'blood_relations', category: 'reasoning', weight: 3 },
          { subtopic: 'syllogisms', category: 'reasoning', weight: 2 },
          { subtopic: 'direction_sense', category: 'reasoning', weight: 2 },
          { subtopic: 'seating_arrangement', category: 'reasoning', weight: 2 },
          { subtopic: 'puzzles', category: 'reasoning', weight: 1 },
          { subtopic: 'analogies', category: 'reasoning', weight: 1 },
          { subtopic: 'statements_assumptions', category: 'reasoning', weight: 1 },
        ]
      }
    ]
  },
  {
    id: 'infosys',
    name: 'Infosys',
    description: '35 questions, 95 minutes. Quant + Logical + Cryptarithmetic + Pseudocode.',
    totalQuestions: 35,
    totalMinutes: 95,
    negativeMarking: false,
    allowsSwitching: true,
    difficulty: 'medium',
    sections: [
      {
        id: 'quant',
        name: 'Quantitative Aptitude',
        questionCount: 10,
        minutes: 35,
        topicPool: [
          { subtopic: 'percentages', category: 'quant', weight: 2 },
          { subtopic: 'profit_loss', category: 'quant', weight: 2 },
          { subtopic: 'time_speed_distance', category: 'quant', weight: 2 },
          { subtopic: 'time_work', category: 'quant', weight: 2 },
          { subtopic: 'number_system', category: 'quant', weight: 2 },
          { subtopic: 'bar_charts', category: 'quant', weight: 2 },
          { subtopic: 'pie_charts', category: 'quant', weight: 1 },
          { subtopic: 'ratios_proportions', category: 'quant', weight: 2 },
          { subtopic: 'averages', category: 'quant', weight: 1 },
          { subtopic: 'probability', category: 'quant', weight: 1 },
          { subtopic: 'permutations_combinations', category: 'quant', weight: 1 },
        ]
      },
      {
        id: 'logical',
        name: 'Logical Reasoning',
        questionCount: 10,
        minutes: 35,
        topicPool: [
          { subtopic: 'series', category: 'reasoning', weight: 4 },
          { subtopic: 'coding_decoding', category: 'reasoning', weight: 3 },
          { subtopic: 'blood_relations', category: 'reasoning', weight: 2 },
          { subtopic: 'syllogisms', category: 'reasoning', weight: 2 },
          { subtopic: 'seating_arrangement', category: 'reasoning', weight: 2 },
          { subtopic: 'direction_sense', category: 'reasoning', weight: 2 },
          { subtopic: 'analogies', category: 'reasoning', weight: 1 },
          { subtopic: 'puzzles', category: 'reasoning', weight: 1 },
        ]
      },
      {
        id: 'verbal',
        name: 'Verbal Ability',
        questionCount: 15,
        minutes: 25,
        topicPool: [
          { subtopic: 'reading_comprehension', category: 'verbal', weight: 4 },
          { subtopic: 'error_spotting', category: 'verbal', weight: 3 },
          { subtopic: 'sentence_correction', category: 'verbal', weight: 3 },
          { subtopic: 'para_jumbles', category: 'verbal', weight: 3 },
          { subtopic: 'fill_blanks', category: 'verbal', weight: 2 },
        ]
      }
    ]
  },
  {
    id: 'wipro',
    name: 'Wipro',
    description: '52 questions, 48 minutes. Very fast paced. Quant + Logical + English.',
    totalQuestions: 52,
    totalMinutes: 48,
    negativeMarking: false,
    allowsSwitching: false,
    difficulty: 'medium',
    sections: [
      {
        id: 'quant',
        name: 'Aptitude',
        questionCount: 16,
        minutes: 16,
        topicPool: [
          { subtopic: 'percentages', category: 'quant', weight: 2 },
          { subtopic: 'profit_loss', category: 'quant', weight: 2 },
          { subtopic: 'bar_charts', category: 'quant', weight: 3 },
          { subtopic: 'pie_charts', category: 'quant', weight: 2 },
          { subtopic: 'line_charts', category: 'quant', weight: 2 },
          { subtopic: 'time_speed_distance', category: 'quant', weight: 2 },
          { subtopic: 'time_work', category: 'quant', weight: 2 },
          { subtopic: 'number_system', category: 'quant', weight: 2 },
          { subtopic: 'ratios_proportions', category: 'quant', weight: 2 },
          { subtopic: 'series', category: 'reasoning', weight: 3 },
        ]
      },
      {
        id: 'reasoning',
        name: 'Logical Reasoning',
        questionCount: 14,
        minutes: 14,
        topicPool: [
          { subtopic: 'series', category: 'reasoning', weight: 4 },
          { subtopic: 'coding_decoding', category: 'reasoning', weight: 3 },
          { subtopic: 'blood_relations', category: 'reasoning', weight: 3 },
          { subtopic: 'syllogisms', category: 'reasoning', weight: 2 },
          { subtopic: 'direction_sense', category: 'reasoning', weight: 2 },
          { subtopic: 'analogies', category: 'reasoning', weight: 1 },
        ]
      },
      {
        id: 'verbal',
        name: 'English',
        questionCount: 22,
        minutes: 18,
        topicPool: [
          { subtopic: 'reading_comprehension', category: 'verbal', weight: 5 },
          { subtopic: 'error_spotting', category: 'verbal', weight: 4 },
          { subtopic: 'sentence_correction', category: 'verbal', weight: 4 },
          { subtopic: 'para_jumbles', category: 'verbal', weight: 4 },
          { subtopic: 'fill_blanks', category: 'verbal', weight: 3 },
          { subtopic: 'synonyms', category: 'verbal', weight: 2 },
        ]
      }
    ]
  },
  {
    id: 'accenture',
    name: 'Accenture',
    description: '50 questions, 50 minutes. Cognitive Assessment with Critical Thinking.',
    totalQuestions: 50,
    totalMinutes: 50,
    negativeMarking: false,
    allowsSwitching: true,
    difficulty: 'medium',
    sections: [
      {
        id: 'english',
        name: 'English',
        questionCount: 20,
        minutes: 20,
        topicPool: [
          { subtopic: 'reading_comprehension', category: 'verbal', weight: 5 },
          { subtopic: 'error_spotting', category: 'verbal', weight: 4 },
          { subtopic: 'sentence_correction', category: 'verbal', weight: 4 },
          { subtopic: 'para_jumbles', category: 'verbal', weight: 3 },
          { subtopic: 'fill_blanks', category: 'verbal', weight: 2 },
          { subtopic: 'grammar', category: 'verbal', weight: 2 },
        ]
      },
      {
        id: 'critical',
        name: 'Critical Thinking',
        questionCount: 15,
        minutes: 15,
        topicPool: [
          { subtopic: 'syllogisms', category: 'reasoning', weight: 4 },
          { subtopic: 'statements_assumptions', category: 'reasoning', weight: 4 },
          { subtopic: 'logical_deductions', category: 'reasoning', weight: 4 },
          { subtopic: 'analogies', category: 'reasoning', weight: 3 },
        ]
      },
      {
        id: 'problem',
        name: 'Problem Solving',
        questionCount: 15,
        minutes: 15,
        topicPool: [
          { subtopic: 'percentages', category: 'quant', weight: 3 },
          { subtopic: 'profit_loss', category: 'quant', weight: 3 },
          { subtopic: 'bar_charts', category: 'quant', weight: 3 },
          { subtopic: 'time_speed_distance', category: 'quant', weight: 3 },
          { subtopic: 'time_work', category: 'quant', weight: 3 },
          { subtopic: 'number_system', category: 'quant', weight: 2 },
          { subtopic: 'series', category: 'reasoning', weight: 2 },
          { subtopic: 'coding_decoding', category: 'reasoning', weight: 2 },
        ]
      }
    ]
  },
  {
    id: 'cognizant',
    name: 'Cognizant GenC',
    description: '30 questions, 30 minutes. Quants + Game Based. Fast paced.',
    totalQuestions: 30,
    totalMinutes: 30,
    negativeMarking: false,
    allowsSwitching: false,
    difficulty: 'medium',
    sections: [
      {
        id: 'quant',
        name: 'Quantitative Aptitude',
        questionCount: 30,
        minutes: 30,
        topicPool: [
          { subtopic: 'percentages', category: 'quant', weight: 3 },
          { subtopic: 'profit_loss', category: 'quant', weight: 3 },
          { subtopic: 'time_speed_distance', category: 'quant', weight: 3 },
          { subtopic: 'time_work', category: 'quant', weight: 3 },
          { subtopic: 'number_system', category: 'quant', weight: 3 },
          { subtopic: 'ratios_proportions', category: 'quant', weight: 3 },
          { subtopic: 'averages', category: 'quant', weight: 2 },
          { subtopic: 'bar_charts', category: 'quant', weight: 3 },
          { subtopic: 'pie_charts', category: 'quant', weight: 2 },
          { subtopic: 'mensuration', category: 'quant', weight: 2 },
          { subtopic: 'probability', category: 'quant', weight: 2 },
          { subtopic: 'permutations_combinations', category: 'quant', weight: 2 },
          { subtopic: 'ages', category: 'quant', weight: 2 },
          { subtopic: 'mixtures_alligations', category: 'quant', weight: 2 },
        ]
      }
    ]
  }
];
