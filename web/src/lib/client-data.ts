import type { Question, TopicData, TopicIndex, PatternsData } from './types';

export async function fetchTopicIndex(): Promise<TopicIndex> {
  const res = await fetch('/data/topic-index.json');
  return res.json();
}

export async function fetchTopicData(category: string, subtopic: string): Promise<TopicData | null> {
  try {
    const res = await fetch(`/data/${category}/${subtopic}.json`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchAllQuestions(): Promise<Question[]> {
  const index = await fetchTopicIndex();
  const all: Question[] = [];
  const categories = ['quant', 'reasoning', 'verbal'] as const;

  for (const cat of categories) {
    const catTopics = index.topics.filter((t) => t.category === cat);
    for (const topic of catTopics) {
      const data = await fetchTopicData(cat, topic.id);
      if (data?.questions) {
        all.push(...data.questions);
      }
    }
  }

  return all;
}

export async function fetchPatterns(): Promise<PatternsData | null> {
  try {
    const res = await fetch('/data/patterns/repeated_patterns.json');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
