const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TOPIC_INDEX_PATH = path.join(DATA_DIR, 'topic-index.json');
const COMPANIES_DIR = path.join(DATA_DIR, 'companies');
const PATTERNS_DIR = path.join(DATA_DIR, 'patterns');

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
      name: data.metadata?.topic || subtopic,
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
