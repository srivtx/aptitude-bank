import fs from 'fs';
import path from 'path';
import type { Question, TopicData, TopicIndex, PatternsData } from './types';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

export function loadTopicIndex(): TopicIndex {
  const filePath = path.join(DATA_DIR, 'topic-index.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as TopicIndex;
}

export function loadTopicData(category: string, subtopic: string): TopicData | null {
  const filePath = path.join(DATA_DIR, category, `${subtopic}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as TopicData;
}

export function loadAllQuestions(): Question[] {
  const index = loadTopicIndex();
  const all: Question[] = [];
  const categories = ['quant', 'reasoning', 'verbal'] as const;

  for (const cat of categories) {
    const catDir = path.join(DATA_DIR, cat);
    if (!fs.existsSync(catDir)) continue;
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(catDir, file), 'utf8');
      const data = JSON.parse(raw) as TopicData;
      if (data.questions) {
        all.push(...data.questions);
      }
    }
  }

  return all;
}

export function loadPatterns(): PatternsData | null {
  const filePath = path.join(DATA_DIR, 'patterns', 'repeated_patterns.json');
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as PatternsData;
}

export function getTopicNames(): { category: string; subtopic: string; name: string }[] {
  const index = loadTopicIndex();
  return index.topics.map(t => ({
    category: t.category,
    subtopic: t.id,
    name: t.name,
  }));
}
