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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Question Bank</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          {filtered.length} of {allQuestions.length} questions
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8 p-4 border border-[var(--border)] bg-[var(--surface)]">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="flex-1 min-w-[200px] px-4 py-2 bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--foreground)]"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--foreground)]"
        >
          <option value="all">All Categories</option>
          <option value="quant">Quant</option>
          <option value="reasoning">Reasoning</option>
          <option value="verbal">Verbal</option>
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--foreground)]"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[var(--text-secondary)]">Loading questions...</div>
      ) : (
        <div className="space-y-[1px] bg-[var(--border)]">
          {filtered.map((q) => (
            <div key={q.id} className="p-5 bg-[var(--background)] hover:bg-[var(--surface)] transition-colors">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-mono text-[var(--text-muted)]">{q.id}</span>
                <div className="flex gap-2 text-xs text-[var(--text-muted)]">
                  <span className="uppercase tracking-wider">{q.topic}</span>
                  <span>{q.difficulty}</span>
                </div>
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-2">{q.question.substring(0, 200)}{q.question.length > 200 ? '...' : ''}</p>
              <div className="text-xs text-[var(--text-muted)]">
                Answer: {q.answer} | {q.company_tags.slice(0, 3).join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
