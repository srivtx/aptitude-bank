'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ROADMAP_STAGES, type RoadmapTopic } from '@/lib/roadmap-data';

type ViewMode = 'stage' | 'category';

const STAGE_COLORS = [
  'from-blue-500 to-blue-600',
  'from-cyan-500 to-blue-500',
  'from-teal-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-green-500 to-emerald-500',
  'from-yellow-500 to-amber-500',
  'from-orange-500 to-yellow-500',
  'from-red-500 to-orange-500',
  'from-rose-500 to-red-500',
];

export default function RoadmapPage() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('stage');
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Aptitude Roadmap</h1>
        <p className="text-[var(--text-secondary)] text-sm">{done}/{total} topics • {pct}% complete</p>
        <div className="max-w-lg mx-auto mt-3 h-2 rounded-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-lg bg-[var(--surface)] border border-[var(--border)] p-1">
          <button onClick={() => setViewMode('stage')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'stage' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'}`}>By Stage</button>
          <button onClick={() => setViewMode('category')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'category' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'}`}>By Category</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-5 mb-8 text-xs">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500/60" /><span className="text-[var(--text-secondary)]">Quant</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-purple-500/60" /><span className="text-[var(--text-secondary)]">Reasoning</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500/60" /><span className="text-[var(--text-secondary)]">Verbal</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm border border-[var(--success)]" /><span className="text-[var(--text-secondary)]">Done</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm border border-dashed border-[var(--warning)]" /><span className="text-[var(--text-secondary)]">Critical</span></div>
      </div>

      {viewMode === 'stage' ? (
        <StageView completed={completed} onToggle={toggle} hoveredTopic={hoveredTopic} setHoveredTopic={setHoveredTopic} />
      ) : (
        <CategoryView completed={completed} onToggle={toggle} hoveredTopic={hoveredTopic} setHoveredTopic={setHoveredTopic} />
      )}

      {/* Footer tip */}
      <div className="mt-12 p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <h3 className="font-semibold mb-2 text-center">How to use this roadmap</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[var(--text-secondary)] text-center">
          <div><span className="text-[var(--accent)] font-bold">1.</span> Go left to right through stages. Each unlocks the next.</div>
          <div><span className="text-[var(--accent)] font-bold">2.</span> Click any topic to practice. Mark done when confident.</div>
          <div><span className="text-[var(--accent)] font-bold">3.</span> Critical (dashed border) are asked by every company.</div>
        </div>
      </div>
    </div>
  );
}

/* ───────── By Stage View ───────── */

function StageView({ completed, onToggle, hoveredTopic, setHoveredTopic }: any) {
  return (
    <div className="space-y-10">
      {ROADMAP_STAGES.map((stage, idx) => {
        const stageDone = stage.topics.filter((t) => completed.has(t.id)).length;
        const stagePct = Math.round((stageDone / stage.topics.length) * 100);
        const colorClass = STAGE_COLORS[idx % STAGE_COLORS.length];

        return (
          <div key={stage.id}>
            {/* Stage Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                {stage.order}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-lg truncate">{stage.name}</h2>
                <p className="text-xs text-[var(--text-muted)] truncate">{stage.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-xs text-[var(--text-muted)]">{stageDone}/{stage.topics.length}</span>
                <div className="w-24 h-1.5 rounded-full bg-[var(--background)] mt-1 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${colorClass}`} style={{ width: `${stagePct}%` }} />
                </div>
              </div>
            </div>

            {/* Topic Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {stage.topics.map((topic) => (
                <TopicTile key={topic.id} topic={topic} isDone={completed.has(topic.id)} onToggle={() => onToggle(topic.id)} isHovered={hoveredTopic === topic.id} onHover={() => setHoveredTopic(topic.id)} onLeave={() => setHoveredTopic(null)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────── By Category View ───────── */

function allTopicsByCategory(category: string) {
  return ROADMAP_STAGES.flatMap((s) => s.topics).filter((t) => t.category === category);
}

function CategoryView({ completed, onToggle, hoveredTopic, setHoveredTopic }: any) {
  const categories = [
    { id: 'quant', name: 'Quantitative', color: 'bg-blue-500', topics: allTopicsByCategory('quant') },
    { id: 'reasoning', name: 'Reasoning', color: 'bg-purple-500', topics: allTopicsByCategory('reasoning') },
    { id: 'verbal', name: 'Verbal', color: 'bg-emerald-500', topics: allTopicsByCategory('verbal') },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {categories.map((cat) => {
        const catDone = cat.topics.filter((t) => completed.has(t.id)).length;
        const catPct = Math.round((catDone / cat.topics.length) * 100);

        return (
          <div key={cat.id}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{cat.name}</h2>
              <span className="text-xs text-[var(--text-muted)]">{catDone}/{cat.topics.length}</span>
            </div>
            <div className="h-1 rounded-full bg-[var(--background)] mb-4 overflow-hidden">
              <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${catPct}%` }} />
            </div>
            <div className="space-y-2">
              {cat.topics.map((topic) => (
                <TopicTile key={topic.id} topic={topic} isDone={completed.has(topic.id)} onToggle={() => onToggle(topic.id)} isHovered={hoveredTopic === topic.id} onHover={() => setHoveredTopic(topic.id)} onLeave={() => setHoveredTopic(null)} compact />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────── Topic Tile ───────── */

function TopicTile({ topic, isDone, onToggle, isHovered, onHover, onLeave, compact = false }: any) {
  const catColor = topic.category === 'quant' ? 'blue' : topic.category === 'reasoning' ? 'purple' : 'emerald';

  const borderClass = isDone
    ? 'border-green-500/40 bg-green-500/5'
    : topic.importance === 'critical'
    ? `border-${catColor}-500/40 border-dashed bg-${catColor}-500/5`
    : `border-${catColor}-500/20 bg-${catColor}-500/5`;

  const hoverClass = isDone
    ? 'hover:border-green-500/60'
    : `hover:border-${catColor}-500/60 hover:bg-${catColor}-500/10`;

  if (compact) {
    return (
      <div className={`relative rounded-lg border transition-all ${borderClass} ${hoverClass}`} onMouseEnter={onHover} onMouseLeave={onLeave}>
        <div className="flex items-center gap-2 p-2.5">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center text-[10px] transition-colors ${
              isDone ? 'bg-green-500 border-green-500 text-white' : 'border-[var(--border)] hover:border-[var(--accent)]'
            }`}
          >
            {isDone && '✓'}
          </button>
          <Link href={`/topic/${topic.category}/${topic.subtopic}`} className="flex-1 text-sm font-medium hover:text-[var(--accent)] transition-colors truncate" onClick={(e) => e.stopPropagation()}>
            {topic.name}
          </Link>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            topic.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
            topic.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {topic.difficulty[0].toUpperCase()}
          </span>
        </div>

        {isHovered && (
          <div className="absolute z-50 left-0 right-0 top-full mt-2 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-xl text-xs">
            <p className="text-[var(--text-secondary)] mb-1">{topic.description}</p>
            <div className="flex gap-2 text-[var(--text-muted)]">
              <span>{topic.questionCount} Qs</span>
              <span>•</span>
              <span>{topic.estimatedHours}h</span>
              <span>•</span>
              <span>{topic.companyFrequency.slice(0, 2).join(', ')}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl border transition-all ${borderClass} ${hoverClass}`} onMouseEnter={onHover} onMouseLeave={onLeave}>
      <div className="p-3">
        <div className="flex items-start justify-between mb-1">
          <Link href={`/topic/${topic.category}/${topic.subtopic}`} className="text-sm font-medium hover:text-[var(--accent)] transition-colors leading-tight" onClick={(e) => e.stopPropagation()}>
            {topic.name}
          </Link>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`ml-1.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center text-[10px] transition-colors ${
              isDone ? 'bg-green-500 border-green-500 text-white' : 'border-[var(--border)] hover:border-[var(--accent)]'
            }`}
          >
            {isDone && '✓'}
          </button>
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            topic.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
            topic.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {topic.difficulty}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">{topic.questionCount} Qs</span>
        </div>
      </div>

      {isHovered && (
        <div className="absolute z-50 left-0 right-0 top-full mt-2 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-xl text-xs">
          <p className="text-[var(--text-secondary)] mb-1">{topic.description}</p>
          <div className="flex gap-2 text-[var(--text-muted)]">
            <span>{topic.estimatedHours}h estimated</span>
            <span>•</span>
            <span>{topic.companyFrequency.slice(0, 3).join(', ')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
