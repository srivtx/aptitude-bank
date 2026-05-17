const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TOPIC_INDEX_PATH = path.join(DATA_DIR, 'topic-index.json');
const COMPANIES_DIR = path.join(DATA_DIR, 'companies');
const PATTERNS_DIR = path.join(DATA_DIR, 'patterns');

const DISPLAY_NAMES = {
  'number_system': 'Number System',
  'hcf_lcm': 'HCF and LCM',
  'percentages': 'Percentages',
  'profit_loss': 'Profit and Loss',
  'simple_interest': 'Simple Interest',
  'compound_interest': 'Compound Interest',
  'ratios_proportions': 'Ratios and Proportions',
  'averages': 'Averages',
  'ages': 'Problems on Ages',
  'time_work': 'Time and Work',
  'time_speed_distance': 'Time, Speed and Distance',
  'boats_streams': 'Boats and Streams',
  'pipes_cisterns': 'Pipes and Cisterns',
  'mixtures_alligations': 'Mixtures and Alligations',
  'partnership': 'Partnership',
  'probability': 'Probability',
  'permutations_combinations': 'Permutations and Combinations',
  'mensuration': 'Mensuration',
  'clocks': 'Clocks',
  'calendars': 'Calendars',
  'data_interpretation': 'Data Interpretation',
  'divisibility': 'Divisibility and Simplification',
  'series': 'Number and Letter Series',
  'coding_decoding': 'Coding and Decoding',
  'blood_relations': 'Blood Relations',
  'seating_arrangement': 'Seating Arrangement',
  'puzzles': 'Puzzles',
  'syllogisms': 'Syllogisms',
  'direction_sense': 'Direction Sense',
  'statements_assumptions': 'Statements and Assumptions',
  'logical_deductions': 'Logical Deductions',
  'analogies': 'Analogies',
  'cubes_and_dices': 'Cubes and Dices',
  'reading_comprehension': 'Reading Comprehension',
  'para_jumbles': 'Para Jumbles',
  'error_spotting': 'Error Spotting',
  'fill_blanks': 'Fill in the Blanks',
  'sentence_correction': 'Sentence Correction',
  'grammar': 'Grammar',
  'synonyms': 'Synonyms',
  'antonyms': 'Antonyms',
  'one_word_substitution': 'One Word Substitution',
};

const categories = ['quant', 'reasoning', 'verbal'];
let totalQuestions = 0;
let totalTopics = 0;
const allIds = new Set();
let duplicates = 0;
const updatedTopics = [];

for (const cat of categories) {
  const catDir = path.join(DATA_DIR, cat);
  if (!fs.existsSync(catDir)) continue;

  const files = fs.readdirSync(catDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const filePath = path.join(catDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const subtopic = data.metadata?.subtopic || file.replace('.json', '');
    const count = data.questions?.length || 0;
    totalQuestions += count;
    totalTopics++;

    // Count difficulty distribution
    const diffCounts = { easy: 0, medium: 0, hard: 0 };
    for (const q of data.questions || []) {
      const d = q.difficulty || 'easy';
      diffCounts[d] = (diffCounts[d] || 0) + 1;
      if (allIds.has(q.id)) {
        duplicates++;
        console.warn(`  DUPLICATE ID: ${q.id} in ${cat}/${file}`);
      }
      allIds.add(q.id);
    }

    updatedTopics.push({
      id: subtopic,
      name: DISPLAY_NAMES[subtopic] || subtopic.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      category: cat,
      total_questions: count,
      difficulty_distribution: diffCounts,
      sources: data.metadata?.sources || ['IndiaBIX']
    });
  }
}

// Add companies and patterns
let companyQuestions = 0;
if (fs.existsSync(COMPANIES_DIR)) {
  const files = fs.readdirSync(COMPANIES_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(COMPANIES_DIR, file), 'utf8'));
    companyQuestions += data.questions?.length || 0;
  }
}

let patternCount = 0;
if (fs.existsSync(PATTERNS_DIR)) {
  const files = fs.readdirSync(PATTERNS_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(PATTERNS_DIR, file), 'utf8'));
    patternCount += data.patterns?.length || 0;
  }
}

const topicIndex = {
  generated_at: new Date().toISOString(),
  total_topics: totalTopics,
  total_questions: totalQuestions,
  total_company_questions: companyQuestions,
  total_patterns: patternCount,
  categories: {
    quant: updatedTopics.filter(t => t.category === 'quant').length,
    reasoning: updatedTopics.filter(t => t.category === 'reasoning').length,
    verbal: updatedTopics.filter(t => t.category === 'verbal').length
  },
  topics: updatedTopics.sort((a, b) => b.total_questions - a.total_questions)
};

fs.writeFileSync(TOPIC_INDEX_PATH, JSON.stringify(topicIndex, null, 2));

console.log('=== Validation Report ===');
console.log(`Total topics: ${totalTopics}`);
console.log(`Total questions: ${totalQuestions}`);
console.log(`Company questions: ${companyQuestions}`);
console.log(`Patterns: ${patternCount}`);
console.log(`Duplicate IDs: ${duplicates}`);
console.log(`\n=== Topic Breakdown ===`);
for (const t of updatedTopics) {
  console.log(`  ${t.category}/${t.id}: ${t.total_questions} questions (easy=${t.difficulty_distribution.easy}, medium=${t.difficulty_distribution.medium}, hard=${t.difficulty_distribution.hard})`);
}
