"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { MockConfig } from "@/lib/mock-data";

interface RawQuestion {
  id: string;
  subtopic: string;
  topic: string;
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
  difficulty?: string;
  company_tags?: string[];
  shortcut?: string;
  formula_used?: string;
  trap_type?: string;
}

interface MockQuestion {
  raw: RawQuestion;
  sectionId: string;
  sectionName: string;
  globalIndex: number;
  sectionIndex: number;
}

interface AnswerState {
  selected: string | null;
  marked: boolean;
  timeSpent: number;
}

export default function MockTestClient({ config }: { config: MockConfig }) {
  const [phase, setPhase] = useState<"intro" | "loading" | "test" | "results">("intro");
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.totalMinutes * 60);
  const [activeSection, setActiveSection] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const qStartTimeRef = useRef<number>(0);

  // Load questions
  const loadQuestions = useCallback(async () => {
    setPhase("loading");
    setError("");

    try {
      const allQuestions: MockQuestion[] = [];
      let globalIndex = 0;

      for (let sIdx = 0; sIdx < config.sections.length; sIdx++) {
        const section = config.sections[sIdx];
        const sectionQuestions: RawQuestion[] = [];

        // Load all topic pools for this section
        for (const pool of section.topicPool) {
          const res = await fetch(`/data/${pool.category}/${pool.subtopic}.json`);
          if (!res.ok) continue;
          const data = await res.json();
          if (data.questions && Array.isArray(data.questions)) {
            // Add weight copies
            for (let w = 0; w < pool.weight; w++) {
              sectionQuestions.push(...data.questions.map((q: any) => ({
                ...q,
                subtopic: pool.subtopic,
              })));
            }
          }
        }

        // Shuffle and pick
        const shuffled = shuffleArray([...sectionQuestions]);
        const picked = shuffled.slice(0, section.questionCount);

        for (let i = 0; i < picked.length; i++) {
          allQuestions.push({
            raw: picked[i],
            sectionId: section.id,
            sectionName: section.name,
            globalIndex,
            sectionIndex: i,
          });
          globalIndex++;
        }
      }

      setQuestions(allQuestions);
      setAnswers(allQuestions.map(() => ({ selected: null, marked: false, timeSpent: 0 })));
      setCurrentQIndex(0);
      setTimeLeft(config.totalMinutes * 60);
      setActiveSection(0);
      setPhase("test");
      setIsRunning(true);
      startTimeRef.current = Date.now();
      qStartTimeRef.current = Date.now();
    } catch (err) {
      setError("Failed to load mock questions. Please try again.");
      setPhase("intro");
    }
  }, [config]);

  // Timer
  useEffect(() => {
    if (!isRunning || phase !== "test") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase("results");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, phase]);

  // Track time per question
  useEffect(() => {
    if (phase === "test" && isRunning) {
      qStartTimeRef.current = Date.now();
    }
  }, [currentQIndex, phase, isRunning]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getSectionStartIndex = (sectionIdx: number) => {
    let count = 0;
    for (let i = 0; i < sectionIdx; i++) {
      count += config.sections[i].questionCount;
    }
    return count;
  };

  const getSectionForIndex = (qIdx: number) => {
    let count = 0;
    for (let i = 0; i < config.sections.length; i++) {
      count += config.sections[i].questionCount;
      if (qIdx < count) return i;
    }
    return 0;
  };

  const selectAnswer = (option: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      const now = Date.now();
      next[currentQIndex] = {
        ...next[currentQIndex],
        selected: option,
        timeSpent: next[currentQIndex].timeSpent + (now - qStartTimeRef.current) / 1000,
      };
      qStartTimeRef.current = now;
      return next;
    });
  };

  const toggleMark = () => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQIndex] = { ...next[currentQIndex], marked: !next[currentQIndex].marked };
      return next;
    });
  };

  const goToQuestion = (idx: number) => {
    if (idx < 0 || idx >= questions.length) return;

    // Update time spent on current question
    setAnswers((prev) => {
      const next = [...prev];
      const now = Date.now();
      next[currentQIndex] = {
        ...next[currentQIndex],
        timeSpent: next[currentQIndex].timeSpent + (now - qStartTimeRef.current) / 1000,
      };
      return next;
    });

    const newSection = getSectionForIndex(idx);
    if (!config.allowsSwitching && newSection < activeSection) {
      return; // Cant go back to previous section
    }
    setActiveSection(newSection);
    setCurrentQIndex(idx);
  };

  const nextQuestion = () => goToQuestion(currentQIndex + 1);
  const prevQuestion = () => goToQuestion(currentQIndex - 1);

  const submitTest = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("results");
  };

  // Results calculation
  const getResults = () => {
    let totalCorrect = 0;
    let totalAnswered = 0;
    let totalMarked = 0;
    const sectionResults = config.sections.map((section) => ({
      ...section,
      correct: 0,
      answered: 0,
      total: section.questionCount,
    }));

    questions.forEach((q, idx) => {
      const ans = answers[idx];
      const sIdx = getSectionForIndex(idx);
      if (ans.selected) {
        totalAnswered++;
        sectionResults[sIdx].answered++;
        const correct = q.raw.answer.toString().trim().toLowerCase();
        const selected = ans.selected.toString().trim().toLowerCase();
        if (correct === selected) {
          totalCorrect++;
          sectionResults[sIdx].correct++;
        }
      }
      if (ans.marked) totalMarked++;
    });

    const totalTime = (Date.now() - startTimeRef.current) / 1000;
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const score = totalCorrect;

    return {
      totalCorrect,
      totalAnswered,
      totalMarked,
      accuracy,
      score,
      totalTime,
      sectionResults,
    };
  };

  const currentQ = questions[currentQIndex];
  const currentAns = answers[currentQIndex];

  // Intro screen
  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-2">{config.name}</h1>
        <p className="text-[var(--text-secondary)] mb-8">{config.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-2xl font-bold">{config.totalQuestions}</div>
            <div className="text-xs text-[var(--text-muted)]">Questions</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-2xl font-bold">{config.totalMinutes}</div>
            <div className="text-xs text-[var(--text-muted)]">Minutes</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-2xl font-bold">{config.sections.length}</div>
            <div className="text-xs text-[var(--text-muted)]">Sections</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-2xl font-bold">{config.negativeMarking ? "Yes" : "No"}</div>
            <div className="text-xs text-[var(--text-muted)]">Negative Marking</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--error)]/10 text-[var(--error)] text-sm">
            {error}
          </div>
        )}

        <div className="mb-8 text-left p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <h3 className="font-semibold mb-3">Instructions</h3>
          <ul className="text-sm text-[var(--text-secondary)] space-y-2 list-disc list-inside">
            <li>Timer starts when you begin the test</li>
            <li>Each question has exactly one correct answer</li>
            {!config.allowsSwitching && (
              <li className="text-[var(--warning)]">
                Section switching is NOT allowed. Once you move to next section, you cannot return.
              </li>
            )}
            <li>Test auto-submits when timer ends</li>
            <li>Use Mark for Review to flag questions for later review</li>
            <li>Questions are randomly selected from our bank each attempt</li>
          </ul>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={loadQuestions}
            className="px-8 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            Start Mock Test
          </button>
          <Link
            href="/mock"
            className="px-8 py-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            Back
          </Link>
        </div>
      </div>
    );
  }

  // Loading screen
  if (phase === "loading") {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
        <p className="text-[var(--text-secondary)]">Preparing your mock test...</p>
      </div>
    );
  }

  // Results screen
  if (phase === "results") {
    const results = getResults();
    const minutes = Math.floor(results.totalTime / 60);
    const seconds = Math.floor(results.totalTime % 60);

    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Mock Test Results</h1>
          <p className="text-[var(--text-secondary)]">{config.name}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
            <div className="text-3xl font-bold text-[var(--accent)]">{results.score}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Score</div>
            <div className="text-xs text-[var(--text-muted)]">/{config.totalQuestions}</div>
          </div>
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
            <div className="text-3xl font-bold text-[var(--success)]">{results.accuracy}%</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Accuracy</div>
          </div>
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
            <div className="text-3xl font-bold">{results.totalAnswered}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Attempted</div>
          </div>
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
            <div className="text-3xl font-bold">{minutes}:{seconds.toString().padStart(2, "0")}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Time Taken</div>
          </div>
        </div>

        {/* Section breakdown */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Section Performance</h3>
          <div className="space-y-2">
            {results.sectionResults.map((sec, idx) => {
              const pct = sec.total > 0 ? Math.round((sec.correct / sec.total) * 100) : 0;
              return (
                <div key={idx} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{sec.name}</span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {sec.correct}/{sec.total} correct ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--background)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all bg-[var(--accent)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">
                    {sec.answered} of {sec.total} attempted
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weak areas */}
        {results.accuracy < 70 && (
          <div className="p-5 rounded-xl bg-[var(--error)]/5 border border-[var(--error)]/20 mb-6">
            <h3 className="font-semibold mb-2 text-[var(--error)]">Focus Areas</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Based on this mock, consider practicing these topics:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {results.sectionResults
                .filter((s) => s.total > 0 && (s.correct / s.total) < 0.6)
                .map((s) => (
                  <span key={s.id} className="text-xs px-2 py-1 rounded-full bg-[var(--error)]/10 text-[var(--error)]">
                    {s.name}
                  </span>
                ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setPhase("intro");
              setQuestions([]);
              setAnswers([]);
            }}
            className="px-8 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            Retake Mock
          </button>
          <Link
            href="/mock"
            className="px-8 py-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            All Mocks
          </Link>
          <Link
            href="/"
            className="px-8 py-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  // Test screen
  if (!currentQ) return null;

  const currentSectionIdx = getSectionForIndex(currentQIndex);
  const currentSection = config.sections[currentSectionIdx];
  const sectionStart = getSectionStartIndex(currentSectionIdx);
  const sectionEnd = sectionStart + currentSection.questionCount;
  const isLastQuestion = currentQIndex === questions.length - 1;
  const isLastInSection = currentQIndex === sectionEnd - 1;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] mb-3">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">{config.name}</span>
          <span className="text-sm text-[var(--text-muted)]">
            Q{currentQIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-2xl font-mono font-bold ${timeLeft < 300 ? "text-[var(--error)] animate-pulse" : ""}`}>
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={submitTest}
            className="px-4 py-2 rounded-lg bg-[var(--error)]/10 text-[var(--error)] text-sm font-medium hover:bg-[var(--error)]/20 transition-colors"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Section tabs */}
      {config.sections.length > 1 && (
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {config.sections.map((sec, idx) => {
            const startIdx = getSectionStartIndex(idx);
            const secAnswered = answers
              .slice(startIdx, startIdx + sec.questionCount)
              .filter((a) => a.selected).length;
            const isActive = idx === currentSectionIdx;
            const isLocked = !config.allowsSwitching && idx < activeSection;
            const isClickable = config.allowsSwitching || idx >= activeSection;

            return (
              <button
                key={sec.id}
                onClick={() => {
                  if (isClickable) {
                    goToQuestion(startIdx);
                  }
                }}
                className={`flex-1 min-w-[140px] px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  isActive
                    ? "bg-[var(--accent)] text-white"
                    : isLocked
                    ? "bg-[var(--background)] text-[var(--text-muted)] opacity-50 cursor-not-allowed"
                    : "bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                <div className="font-medium truncate">{sec.name}</div>
                <div className="text-xs opacity-75">
                  {secAnswered}/{sec.questionCount}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Question area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] mb-3">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-medium">
                {currentQ.sectionName}
              </span>
              {currentQ.raw.difficulty && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  currentQ.raw.difficulty === 'easy' ? 'bg-green-500/10 text-green-400' :
                  currentQ.raw.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {currentQ.raw.difficulty}
                </span>
              )}
              <span className="text-xs text-[var(--text-muted)] ml-auto">
                {currentQ.raw.subtopic.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="text-lg leading-relaxed mb-6 whitespace-pre-wrap">
              {currentQ.raw.question}
            </div>

            {currentQ.raw.options && (
              <div className="space-y-2">
                {currentQ.raw.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = currentAns.selected === opt;
                  return (
                    <button
                      key={idx}
                      onClick={() => selectAnswer(opt)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-[var(--accent)] bg-[var(--accent)]/5"
                          : "border-[var(--border)] hover:border-[var(--accent-hover)] hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      <span className="inline-block w-8 h-8 rounded-full bg-[var(--background)] border border-[var(--border)] text-center leading-7 text-sm font-medium mr-3">
                        {letter}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Question palette */}
        <div className="w-56 hidden lg:block p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-y-auto">
          <h4 className="text-sm font-semibold mb-3">Question Palette</h4>
          <div className="grid grid-cols-4 gap-1.5">
            {questions.map((_, idx) => {
              const isCurrent = idx === currentQIndex;
              const ans = answers[idx];
              const status = ans.selected
                ? "answered"
                : ans.marked
                ? "marked"
                : "unanswered";
              return (
                <button
                  key={idx}
                  onClick={() => goToQuestion(idx)}
                  className={`h-8 rounded-lg text-xs font-medium transition-colors ${
                    isCurrent
                      ? "bg-[var(--accent)] text-white"
                      : status === "answered"
                      ? "bg-[var(--success)]/20 text-[var(--success)]"
                      : status === "marked"
                      ? "bg-[var(--warning)]/20 text-[var(--warning)]"
                      : "bg-[var(--background)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[var(--success)]/20 border border-[var(--success)]/30" />
              <span className="text-[var(--text-muted)]">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[var(--warning)]/20 border border-[var(--warning)]/30" />
              <span className="text-[var(--text-muted)]">Marked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[var(--background)] border border-[var(--border)]" />
              <span className="text-[var(--text-muted)]">Unanswered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex gap-2">
          <button
            onClick={prevQuestion}
            disabled={currentQIndex === 0}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={toggleMark}
            className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
              currentAns.marked
                ? "border-[var(--warning)] bg-[var(--warning)]/10 text-[var(--warning)]"
                : "border-[var(--border)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            {currentAns.marked ? "Unmark" : "Mark for Review"}
          </button>
        </div>

        <div className="flex gap-2">
          {isLastQuestion ? (
            <button
              onClick={submitTest}
              className="px-6 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
            >
              Submit Test
            </button>
          ) : (
            <button
              onClick={() => {
                if (isLastInSection && !config.allowsSwitching) {
                  // Show confirmation before moving to next section
                  if (window.confirm(`You are about to finish ${currentSection.name} and move to the next section. You cannot return. Continue?`)) {
                    nextQuestion();
                  }
                } else {
                  nextQuestion();
                }
              }}
              className="px-6 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
            >
              {isLastInSection ? "Next Section" : "Next"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
