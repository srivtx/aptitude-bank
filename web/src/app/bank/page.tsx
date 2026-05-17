'use client';

import { useState, useMemo, useEffect } from 'react';
import { fetchAllQuestions } from '@/lib/client-data';
import type { Question } from '@/lib/types';

export default function BankPage() {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  useEffect(() => {
    fetchAllQuestions().then((qs) => {
      setAllQuestions(qs);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return allQuestions.filter((q) => {
      if (categoryFilter !== 'all' && q.topic !== categoryFilter) return false;
      if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          q.question.toLowerCase().includes(s) ||
          q.subtopic.toLowerCase().includes(s) ||
          q.id.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [allQuestions, search, categoryFilter, difficultyFilter]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Question Bank</h1>
        <p className="text-[var(--text-secondary)]">
          {filtered.length} of {allQuestions.length} questions
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="all">All Categories</option>
          <option value="quant">Quant</option>
          <option value="reasoning">Reasoning</option>
          <option value="verbal">Verbal</option>
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.slice(0, 100).map((q) => (
          <div
            key={q.id}
            className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-medium flex-1 mr-4">
                {q.question.substring(0, 120)}{q.question.length > 120 ? '...' : ''}
              </p>
              <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${
                q.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {q.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
              <span>{q.subtopic.replace(/_/g, ' ')}</span>
              <span>|</span>
              <span>{q.topic}</span>
              <span>|</span>
              <span className="font-mono">{q.id}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length > 100 && (
        <p className="text-center text-sm text-[var(--text-muted)] mt-4">
          Showing first 100 of {filtered.length} results. Refine your search.
        </p>
      )}

      {filtered.length === 0 && !loading && (
        <p className="text-center text-[var(--text-secondary)] py-12">No questions match your filters.</p>
      )}

      {loading && (
        <p className="text-center text-[var(--text-secondary)] py-12">Loading questions...</p>
      )}
    </div>
  );
}
