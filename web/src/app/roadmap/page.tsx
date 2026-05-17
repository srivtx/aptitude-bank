'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ROADMAP_STAGES, type RoadmapTopic } from '@/lib/roadmap-data';

const categoryColors: Record<string, string> = {
  quant: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  reasoning: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  verbal: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
};

const importanceColors: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-slate-500/20 text-slate-400',
};

const difficultyColors: Record<string, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

export default function RoadmapPage() {
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('aptitude-completed-topics');
    if (saved) {
      setCompletedTopics(new Set(JSON.parse(saved)));
    }
  }, []);

  const toggleTopic = (topicId: string) => {
    setCompletedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      localStorage.setItem('aptitude-completed-topics', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const totalTopics = ROADMAP_STAGES.reduce((sum, s) => sum + s.topics.length, 0);
  const completedCount = completedTopics.size;
  const progressPercent = Math.round((completedCount / totalTopics) * 100);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Placement Aptitude Roadmap</h1>
        <p className="text-[var(--text-secondary)] mb-6 max-w-2xl mx-auto">
          A research-backed path to master placement aptitude. Follow stages in order. 
          Each topic unlocks the next. Click any topic to practice.
        </p>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--text-secondary)]">Overall Progress</span>
            <span className="font-medium">{completedCount}/{totalTopics} topics ({progressPercent}%)</span>
          </div>
          <div className="h-3 rounded-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mb-10 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500/60" />
          <span className="text-[var(--text-secondary)]">Quant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500/60" />
          <span className="text-[var(--text-secondary)]">Reasoning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          <span className="text-[var(--text-secondary)]">Verbal</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">Critical</span>
          <span className="text-[var(--text-muted)]">= Heavy in all exams</span>
        </div>
      </div>

      {/* Stages */}
      <div className="relative">
        {/* Central line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-emerald-500/50 hidden md:block" />

        {ROADMAP_STAGES.map((stage, stageIndex) => {
          const isExpanded = expandedStage === stage.id;
          const stageCompleted = stage.topics.filter((t) => completedTopics.has(t.id)).length;
          const stageTotal = stage.topics.length;
          const stageProgress = Math.round((stageCompleted / stageTotal) * 100);

          return (
            <div key={stage.id} className="relative mb-12">
              {/* Stage Header */}
              <div className="flex flex-col items-center mb-6">
                {/* Stage number dot */}
                <div className="relative z-10 w-10 h-10 rounded-full bg-[var(--surface)] border-2 border-[var(--accent)] flex items-center justify-center font-bold text-sm mb-3">
                  {stage.order}
                </div>

                <button
                  onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                  className="text-center group"
                >
                  <h2 className="text-xl font-bold group-hover:text-[var(--accent)] transition-colors">
                    {stage.name}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] max-w-lg mt-1">
                    {stage.description}
                  </p>
                  <div className="mt-2 text-xs text-[var(--text-muted)]">
                    {stageCompleted}/{stageTotal} completed • {stage.topics.reduce((s, t) => s + t.estimatedHours, 0)} hrs estimated
                  </div>
                </button>

                {/* Stage progress bar */}
                <div className="w-48 h-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] mt-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                    style={{ width: `${stageProgress}%` }}
                  />
                </div>
              </div>

              {/* Topics Grid */}
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-300 ${isExpanded ? '' : ''}`}>
                {stage.topics.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    isCompleted={completedTopics.has(topic.id)}
                    onToggle={() => toggleTopic(topic.id)}
                  />
                ))}
              </div>

              {/* Down arrow between stages */}
              {stageIndex < ROADMAP_STAGES.length - 1 && (
                <div className="flex justify-center mt-8">
                  <svg className="w-6 h-6 text-[var(--text-muted)] animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Stats */}
      <div className="mt-16 p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
        <h3 className="text-lg font-semibold mb-2">Study Strategy</h3>
        <p className="text-[var(--text-secondary)] text-sm max-w-2xl mx-auto">
          <strong>Week 1-2:</strong> Complete Stages 1-2 (Foundation + Core Arithmetic). 
          These unlock 80% of quant topics.<br />
          <strong>Week 3-4:</strong> Complete Stages 3-4 (Applied Quant + Rate Problems). 
          Most heavily tested.<br />
          <strong>Week 5:</strong> Stage 5 (Advanced Quant) + Stage 6 (Core Reasoning).<br />
          <strong>Week 6:</strong> Stages 7-9 (Advanced Reasoning + Verbal).<br />
          <strong>Daily:</strong> Practice 20 questions from completed topics to maintain speed.
        </p>
      </div>
    </div>
  );
}

function TopicCard({
  topic,
  isCompleted,
  onToggle,
}: {
  topic: RoadmapTopic;
  isCompleted: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`relative p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${
        isCompleted
          ? 'border-green-500/40 bg-green-500/5'
          : `${categoryColors[topic.category]} hover:border-opacity-100`
      }`}
    >
      {/* Completed badge */}
      {isCompleted && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
          ✓
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <Link
          href={`/topic/${topic.category}/${topic.subtopic}`}
          className="font-medium hover:text-[var(--accent)] transition-colors flex-1 mr-2"
        >
          {topic.name}
        </Link>
        <span className={`text-xs px-1.5 py-0.5 rounded ${importanceColors[topic.importance]}`}>
          {topic.importance}
        </span>
      </div>

      <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">
        {topic.description}
      </p>

      <div className="flex flex-wrap gap-2 text-xs mb-3">
        <span className={difficultyColors[topic.difficulty]}>
          {topic.difficulty}
        </span>
        <span className="text-[var(--text-muted)]">|</span>
        <span className="text-[var(--text-muted)]">{topic.estimatedHours}h</span>
        <span className="text-[var(--text-muted)]">|</span>
        <span className="text-[var(--text-muted)]">{topic.questionCount} Qs</span>
      </div>

      {/* Company tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {topic.companyFrequency.slice(0, 3).map((c) => (
          <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--background)] text-[var(--text-muted)]">
            {c}
          </span>
        ))}
      </div>

      {/* Requires / Unlocks */}
      {(topic.requires.length > 0 || topic.unlocks.length > 0) && (
        <div className="text-[10px] text-[var(--text-muted)] mb-3 space-y-1">
          {topic.requires.length > 0 && (
            <div>Requires: {topic.requires.map((r) => (
              <span key={r} className="text-[var(--accent)]">{r.replace(/_/g, ' ')} </span>
            ))}</div>
          )}
          {topic.unlocks.length > 0 && (
            <div>Unlocks: {topic.unlocks.map((u) => (
              <span key={u} className="text-green-400">{u.replace(/_/g, ' ')} </span>
            ))}</div>
          )}
        </div>
      )}

      {/* Mark complete button */}
      <button
        onClick={onToggle}
        className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${
          isCompleted
            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-white'
        }`}
      >
        {isCompleted ? 'Completed' : 'Mark as Done'}
      </button>
    </div>
  );
}
