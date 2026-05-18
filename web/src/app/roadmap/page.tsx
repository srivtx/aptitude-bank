'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ROADMAP_STAGES, type RoadmapTopic } from '@/lib/roadmap-data';

type ViewMode = 'stage' | 'category';

export default function RoadmapPage() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('stage');

  useEffect(() => {
    const saved = localStorage.getItem('aptitude-completed-topics');
    if (saved) setCompleted(new Set(JSON.parse(saved)));
  }, []);

  const toggle = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('aptitude-completed-topics', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const allTopics = ROADMAP_STAGES.flatMap((s) => s.topics);
  const done = completed.size;
  const total = allTopics.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Aptitude Roadmap</h1>
        <p className="text-[var(--text-secondary)] text-sm">{done}/{total} topics • {pct}% complete</p>
        <div className="max-w-lg mt-4 h-[1px] bg-[var(--border)]">
          <div className="h-full bg-[var(--foreground)] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex justify-center mb-10">
        <div className="inline-flex border border-[var(--border)]">
          <button onClick={() => setViewMode('stage')} className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'stage' ? 'bg-[var(--foreground)] text-[var(--background)]' : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'}`}>By Stage</button>
          <button onClick={() => setViewMode('category')} className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'category' ? 'bg-[var(--foreground)] text-[var(--background)]' : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'}`}>By Category</button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-6 mb-10 text-xs text-[var(--text-muted)]">
        <span>Quant</span>
        <span>Reasoning</span>
        <span>Verbal</span>
        <span>Done</span>
        <span>Critical</span>
      </div>

      {viewMode === 'stage' ? (
        <StageView completed={completed} onToggle={toggle} />
      ) : (
        <CategoryView completed={completed} onToggle={toggle} />
      )}
    </div>
  );
}

function StageView({ completed, onToggle }: any) {
  return (
    <div className="space-y-12">
      {ROADMAP_STAGES.map((stage) => {
        const stageDone = stage.topics.filter((t) => completed.has(t.id)).length;
        const stagePct = Math.round((stageDone / stage.topics.length) * 100);

        return (
          <div key={stage.id}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 border border-[var(--border)] flex items-center justify-center text-sm font-medium">
                {stage.order}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-lg">{stage.name}</h2>
                <p className="text-xs text-[var(--text-muted)]">{stage.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-xs text-[var(--text-muted)]">{stageDone}/{stage.topics.length}</span>
                <div className="w-24 h-[1px] bg-[var(--border)] mt-2">
                  <div className="h-full bg-[var(--foreground)]" style={{ width: `${stagePct}%` }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-[1px] bg-[var(--border)]">
              {stage.topics.map((topic) => (
                <TopicTile key={topic.id} topic={topic} isDone={completed.has(topic.id)} onToggle={() => onToggle(topic.id)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function allTopicsByCategory(category: string) {
  return ROADMAP_STAGES.flatMap((s) => s.topics).filter((t) => t.category === category);
}

function CategoryView({ completed, onToggle }: any) {
  const categories = [
    { id: 'quant', name: 'Quantitative', topics: allTopicsByCategory('quant') },
    { id: 'reasoning', name: 'Reasoning', topics: allTopicsByCategory('reasoning') },
    { id: 'verbal', name: 'Verbal', topics: allTopicsByCategory('verbal') },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {categories.map((cat) => {
        const catDone = cat.topics.filter((t) => completed.has(t.id)).length;
        const catPct = Math.round((catDone / cat.topics.length) * 100);

        return (
          <div key={cat.id}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">{cat.name}</h2>
              <span className="text-xs text-[var(--text-muted)]">{catDone}/{cat.topics.length}</span>
            </div>
            <div className="h-[1px] bg-[var(--border)] mb-4">
              <div className="h-full bg-[var(--foreground)]" style={{ width: `${catPct}%` }} />
            </div>
            <div className="space-y-[1px] bg-[var(--border)]">
              {cat.topics.map((topic) => (
                <TopicTile key={topic.id} topic={topic} isDone={completed.has(topic.id)} onToggle={() => onToggle(topic.id)} compact />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TopicTile({ topic, isDone, onToggle, compact = false }: any) {
  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-[var(--background)] hover:bg-[var(--surface)] transition-colors ${isDone ? 'opacity-60' : ''}`}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`w-4 h-4 border flex-shrink-0 flex items-center justify-center text-[8px] transition-colors ${isDone ? 'bg-[var(--success)] border-[var(--success)] text-[var(--background)]' : 'border-[var(--border)]'}`}
        >
          {isDone && '✓'}
        </button>
        <Link href={`/topic/${topic.category}/${topic.subtopic}`} className="flex-1 text-sm hover:opacity-80 transition-opacity truncate" onClick={(e) => e.stopPropagation()}>
          {topic.name}
        </Link>
        <span className="text-[10px] text-[var(--text-muted)] uppercase">{topic.difficulty[0]}</span>
      </div>
    );
  }

  return (
    <div className={`p-3 bg-[var(--background)] hover:bg-[var(--surface)] transition-colors ${isDone ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-1">
        <Link href={`/topic/${topic.category}/${topic.subtopic}`} className="text-sm font-medium hover:opacity-80 transition-opacity leading-tight" onClick={(e) => e.stopPropagation()}>
          {topic.name}
        </Link>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`ml-1.5 w-4 h-4 border flex-shrink-0 flex items-center justify-center text-[8px] transition-colors ${isDone ? 'bg-[var(--success)] border-[var(--success)] text-[var(--background)]' : 'border-[var(--border)]'}`}
        >
          {isDone && '✓'}
        </button>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px] text-[var(--text-muted)] uppercase">{topic.difficulty}</span>
        <span className="text-[10px] text-[var(--text-muted)]">{topic.questionCount} Qs</span>
      </div>
    </div>
  );
}
