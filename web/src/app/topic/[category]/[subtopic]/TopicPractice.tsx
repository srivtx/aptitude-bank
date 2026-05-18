'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { TopicData } from '@/lib/types';

interface TopicPracticeProps {
  data: TopicData;
}

export default function TopicPractice({ data }: TopicPracticeProps) {
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [shuffle, setShuffle] = useState(false);
  const [questions, setQuestions] = useState(data.questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [completed, setCompleted] = useState(false);

  const currentQuestion = questions[currentIndex];
  const labels = ['A', 'B', 'C', 'D', 'E'];

  const filteredQuestions = useMemo(() => {
    return data.questions.filter((q) => {
      if (difficultyFilter === 'all') return true;
      return q.difficulty === difficultyFilter;
    });
  }, [data.questions, difficultyFilter]);

  const startPractice = useCallback(() => {
    let qs = [...filteredQuestions];
    if (shuffle) {
      qs = qs.sort(() => Math.random() - 0.5);
    }
    setQuestions(qs);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowSolution(false);
    setSessionStats({ correct: 0, total: 0 });
    setCompleted(false);
  }, [filteredQuestions, shuffle]);

  useEffect(() => {
    startPractice();
  }, [startPractice]);

  const handleOptionClick = (index: number) => {
    if (showSolution) return;
    setSelectedOption(index);
  };

  const handleCheck = () => {
    if (selectedOption === null) return;
    setShowSolution(true);
    const correctIndex = labels.indexOf(currentQuestion.answer);
    const isCorrect = selectedOption === correctIndex;
    setSessionStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setCompleted(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setShowSolution(false);
  };

  const handleSkip = () => {
    handleNext();
  };

  if (completed) {
    const accuracy = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Session Complete!</h2>
        <div className="inline-block p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="text-4xl font-bold text-[var(--accent)] mb-2">{accuracy}%</div>
          <p className="text-[var(--text-secondary)]">
            {sessionStats.correct} / {sessionStats.total} correct
          </p>
        </div>
        <div className="mt-6">
          <button
            onClick={startPractice}
            className="px-6 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--text-secondary)]">No questions available with current filter.</p>
      </div>
    );
  }

  const correctIndex = labels.indexOf(currentQuestion.answer);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">
          {data.metadata?.subtopic ? data.metadata.subtopic.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Practice'}
        </h1>
        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
          <span>Question {currentIndex + 1} / {questions.length}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            currentQuestion.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
            currentQuestion.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {currentQuestion.difficulty}
          </span>
          <span>Score: {sessionStats.correct}/{sessionStats.total}</span>
        </div>
      </div>

      {/* Setup bar */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy Only</option>
          <option value="medium">Medium Only</option>
          <option value="hard">Hard Only</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={shuffle}
            onChange={(e) => setShuffle(e.target.checked)}
            className="rounded border-[var(--border)]"
          />
          Shuffle
        </label>
        <button
          onClick={startPractice}
          className="px-4 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-sm hover:border-[var(--accent)] transition-colors"
        >
          Restart
        </button>
      </div>

      {/* Question Card */}
      <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] mb-6">
        <div className="flex items-center gap-3 mb-4 text-xs text-[var(--text-muted)]">
          <span className="font-mono">{currentQuestion.id}</span>
          <span>|</span>
          <span>{currentQuestion.company_tags.slice(0, 3).join(', ')}</span>
        </div>

        {currentQuestion.image_url && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-3">
              {currentQuestion.subtopic.includes('chart') ? 'Chart' : 'Figure'}
            </h4>
            <img
              src={currentQuestion.image_url}
              alt="Question figure"
              className="max-w-full h-auto mx-auto rounded-lg"
              loading="eager"
            />
          </div>
        )}

        {currentQuestion.passage && (
          <div className="mb-6 p-5 rounded-xl bg-[var(--background)] border border-[var(--border)] border-l-4 border-l-[var(--accent)]">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
              {currentQuestion.subtopic.includes('chart') ? 'Chart Directions' : 'Passage'}
            </h4>
            <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{currentQuestion.passage}</p>
          </div>
        )}

        <p className="text-lg mb-6 leading-relaxed">{currentQuestion.question}</p>

        <div className="space-y-3">
          {currentQuestion.options.map((opt, i) => {
            const hasOptImages = currentQuestion.option_images && currentQuestion.option_images[i];
            let optionClass = 'p-4 rounded-lg border border-[var(--border)] bg-[var(--background)] cursor-pointer hover:border-[var(--accent)] transition-all';
            if (showSolution) {
              if (i === correctIndex) {
                optionClass = 'p-4 rounded-lg border border-[var(--success)] bg-green-500/10';
              } else if (i === selectedOption) {
                optionClass = 'p-4 rounded-lg border border-[var(--error)] bg-red-500/10';
              } else {
                optionClass = 'p-4 rounded-lg border border-[var(--border)] bg-[var(--background)] opacity-50';
              }
            } else if (i === selectedOption) {
              optionClass = 'p-4 rounded-lg border border-[var(--accent)] bg-blue-500/10';
            }

            return (
              <div
                key={i}
                onClick={() => handleOptionClick(i)}
                className={optionClass}
              >
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface)] text-sm font-medium">
                    {labels[i]}
                  </span>
                  {hasOptImages ? (
                    <img
                      src={currentQuestion.option_images![i]}
                      alt={`Option ${labels[i]}`}
                      className="h-20 w-auto object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span>{opt}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {!showSolution ? (
            <>
              <button
                onClick={handleCheck}
                disabled={selectedOption === null}
                className="px-6 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Check Answer
              </button>
              <button
                onClick={handleSkip}
                className="px-6 py-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
              >
                Skip
              </button>
            </>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors"
            >
              {currentIndex + 1 >= questions.length ? 'Finish' : 'Next Question'}
            </button>
          )}
        </div>
      </div>

      {/* Solution Panel */}
      {showSolution && (
        <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
          <div className={`inline-block px-4 py-2 rounded-lg font-medium ${
            selectedOption === correctIndex
              ? 'bg-green-500/20 text-[var(--success)]'
              : 'bg-red-500/20 text-[var(--error)]'
          }`}>
            {selectedOption === correctIndex ? 'Correct!' : `Incorrect. Answer: ${currentQuestion.answer}`}
          </div>

          {currentQuestion.answer_image_url && (
            <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">Answer Figure</h4>
              <img
                src={currentQuestion.answer_image_url}
                alt="Answer figure"
                className="max-w-full h-auto mx-auto rounded-lg"
              />
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-[var(--text-muted)] mb-1">Explanation</h4>
            <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{currentQuestion.explanation}</p>
          </div>

          {currentQuestion.shortcut && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h4 className="text-sm font-medium text-[var(--accent)] mb-1">Shortcut</h4>
              <p className="text-sm">{currentQuestion.shortcut}</p>
            </div>
          )}

          {currentQuestion.formula_used && (
            <div>
              <h4 className="text-sm font-medium text-[var(--text-muted)] mb-1">Formula</h4>
              <code className="text-sm bg-[var(--background)] px-3 py-1.5 rounded-lg block">{currentQuestion.formula_used}</code>
            </div>
          )}

          {currentQuestion.trap_type && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <h4 className="text-sm font-medium text-[var(--warning)] mb-1">Common Trap</h4>
              <p className="text-sm">{currentQuestion.trap_type}</p>
            </div>
          )}

          <div className="text-xs text-[var(--text-muted)]">
            Source: {currentQuestion.source}
          </div>
        </div>
      )}
    </div>
  );
}
