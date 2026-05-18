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

  const loadQuestions = useCallback(async () => {
    setPhase("loading");
    setError("");

    try {
      const allQuestions: MockQuestion[] = [];
      let globalIndex = 0;

      for (let sIdx = 0; sIdx < config.sections.length; sIdx++) {
        const section = config.sections[sIdx];
        const sectionQuestions: RawQuestion[] = [];

        for (const pool of section.topicPool) {
          const res = await fetch(`/data/${pool.category}/${pool.subtopic}.json`);
          if (!res.ok) continue;
          const data = await res.json();
          if (data.questions && Array.isArray(data.questions)) {
            for (let w = 0; w < pool.weight; w++) {
              sectionQuestions.push(...data.questions.map((q: any) => ({
                ...q,
                subtopic: pool.subtopic,
              })));
            }
          }
        }

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
    if (!config.allowsSwitching && newSection < activeSection) return;
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

    return { totalCorrect, totalAnswered, totalMarked, accuracy, score, totalTime, sectionResults };
  };

  const currentQ = questions[currentQIndex];
  const currentAns = answers[currentQIndex];

  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">{config.name}</h1>
        <p className="text-[var(--text-secondary)] mb-10">{config.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[var(--border)] mb-10">
          {[
            { label: "Questions", value: config.totalQuestions },
            { label: "Minutes", value: config.totalMinutes },
            { label: "Sections", value: config.sections.length },
            { label: "Negative", value: config.negativeMarking ? "Yes" : "No" },
          ].map((item) => (
            <div key={item.label} className="p-5 bg-[var(--surface)]">
              <div className="text-2xl font-semibold">{item.value}</div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">{item.label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 border border-[var(--error)] text-[var(--error)] text-sm">
            {error}
          </div>
        )}

        <div className="mb-10 text-left p-6 border border-[var(--border)] bg-[var(--surface)]">
          <h3 className="text-sm font-medium uppercase tracking-wider text-[var(--text-muted)] mb-4">Instructions</h3>
          <ul className="text-sm text-[var(--text-secondary)] space-y-2">
            <li>Timer starts when you begin the test</li>
            <li>Each question has exactly one correct answer</li>
            {!config.allowsSwitching && (
              <li className="text-[var(--warning)]">Section switching is NOT allowed</li>
            )}
            <li>Test auto-submits when timer ends</li>
            <li>Use Mark for Review to flag questions</li>
          </ul>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={loadQuestions}
            className="px-8 py-2.5 border border-[var(--foreground)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
          >
            Start Mock Test
          </button>
          <Link href="/mock" className="px-8 py-2.5 border border-[var(--border)] text-sm hover:border-[var(--foreground)] transition-colors">
            Back
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="text-center py-20">
        <div className="animate-spin h-8 w-8 border-b-2 border-[var(--foreground)] mx-auto mb-4"></div>
        <p className="text-[var(--text-secondary)] text-sm">Preparing your mock test...</p>
      </div>
    );
  }

  if (phase === "results") {
    const results = getResults();
    const minutes = Math.floor(results.totalTime / 60);
    const seconds = Math.floor(results.totalTime % 60);

    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Mock Test Results</h1>
          <p className="text-[var(--text-secondary)]">{config.name}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[var(--border)] mb-10">
          {[
            { label: "Score", value: `${results.score}/${config.totalQuestions}` },
            { label: "Accuracy", value: `${results.accuracy}%` },
            { label: "Attempted", value: results.totalAnswered },
            { label: "Time", value: `${minutes}:${seconds.toString().padStart(2, "0")}` },
          ].map((item) => (
            <div key={item.label} className="p-6 bg-[var(--surface)] text-center">
              <div className="text-2xl font-semibold">{item.value}</div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="mb-10">
          <h3 className="text-sm font-medium uppercase tracking-wider text-[var(--text-muted)] mb-4">Section Performance</h3>
          <div className="space-y-2">
            {results.sectionResults.map((sec, idx) => {
              const pct = sec.total > 0 ? Math.round((sec.correct / sec.total) * 100) : 0;
              return (
                <div key={idx} className="p-4 border border-[var(--border)] bg-[var(--surface)]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium">{sec.name}</span>
                    <span className="text-sm text-[var(--text-secondary)]">{sec.correct}/{sec.total} ({pct}%)</span>
                  </div>
                  <div className="h-1 bg-[var(--background)]">
                    <div className="h-full bg-[var(--foreground)] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-2">{sec.answered} of {sec.total} attempted</div>
                </div>
              );
            })}
          </div>
        </div>

        {results.accuracy < 70 && (
          <div className="p-5 border border-[var(--error)] mb-10">
            <h3 className="text-sm font-medium uppercase tracking-wider text-[var(--error)] mb-2">Focus Areas</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Based on this mock, consider practicing:</p>
            <div className="flex flex-wrap gap-2">
              {results.sectionResults
                .filter((s) => s.total > 0 && (s.correct / s.total) < 0.6)
                .map((s) => (
                  <span key={s.id} className="text-xs px-2 py-1 border border-[var(--error)] text-[var(--error)]">
                    {s.name}
                  </span>
                ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setPhase("intro"); setQuestions([]); setAnswers([]); }}
            className="px-8 py-2.5 border border-[var(--foreground)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
          >
            Retake Mock
          </button>
          <Link href="/mock" className="px-8 py-2.5 border border-[var(--border)] text-sm hover:border-[var(--foreground)] transition-colors">
            All Mocks
          </Link>
        </div>
      </div>
    );
  }

  if (!currentQ) return null;

  const currentSectionIdx = getSectionForIndex(currentQIndex);
  const currentSection = config.sections[currentSectionIdx];
  const sectionStart = getSectionStartIndex(currentSectionIdx);
  const sectionEnd = sectionStart + currentSection.questionCount;
  const isLastQuestion = currentQIndex === questions.length - 1;
  const isLastInSection = currentQIndex === sectionEnd - 1;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between p-4 border border-[var(--border)] bg-[var(--surface)] mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">{config.name}</span>
          <span className="text-sm text-[var(--text-muted)]">Q{currentQIndex + 1} / {questions.length}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-xl font-mono font-medium ${timeLeft < 300 ? "text-[var(--error)]" : ""}`}>
            {formatTime(timeLeft)}
          </div>
          <button onClick={submitTest} className="px-4 py-1.5 border border-[var(--error)] text-[var(--error)] text-xs hover:bg-[var(--error)] hover:text-[var(--background)] transition-colors">
            Submit
          </button>
        </div>
      </div>

      {config.sections.length > 1 && (
        <div className="flex gap-[1px] mb-4 overflow-x-auto bg-[var(--border)]">
          {config.sections.map((sec, idx) => {
            const startIdx = getSectionStartIndex(idx);
            const secAnswered = answers.slice(startIdx, startIdx + sec.questionCount).filter((a) => a.selected).length;
            const isActive = idx === currentSectionIdx;
            const isLocked = !config.allowsSwitching && idx < activeSection;
            const isClickable = config.allowsSwitching || idx >= activeSection;

            return (
              <button
                key={sec.id}
                onClick={() => { if (isClickable) goToQuestion(startIdx); }}
                className={`flex-1 min-w-[140px] px-3 py-2 text-sm text-left transition-colors ${
                  isActive
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : isLocked
                    ? "bg-[var(--background)] text-[var(--text-muted)] opacity-40 cursor-not-allowed"
                    : "bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                }`}
              >
                <div className="font-medium truncate">{sec.name}</div>
                <div className="text-xs opacity-60">{secAnswered}/{sec.questionCount}</div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="p-6 border border-[var(--border)] bg-[var(--surface)] mb-4">
            <div className="flex items-center gap-3 mb-4 text-xs text-[var(--text-muted)] uppercase tracking-wider">
              <span>{currentQ.sectionName}</span>
              {currentQ.raw.difficulty && <span>{currentQ.raw.difficulty}</span>}
              <span className="ml-auto">{currentQ.raw.subtopic.replace(/_/g, ' ')}</span>
            </div>

            <div className="text-lg leading-relaxed mb-6 whitespace-pre-wrap">{currentQ.raw.question}</div>

            {currentQ.raw.options && (
              <div className="space-y-2">
                {currentQ.raw.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = currentAns.selected === opt;
                  return (
                    <button
                      key={idx}
                      onClick={() => selectAnswer(opt)}
                      className={`w-full text-left p-4 border transition-colors ${
                        isSelected
                          ? "border-[var(--foreground)] bg-[var(--surface)]"
                          : "border-[var(--border)] hover:border-[var(--foreground)]"
                      }`}
                    >
                      <span className="inline-block w-6 text-sm font-medium mr-3 text-[var(--text-muted)]">{letter}</span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="w-52 hidden lg:block p-4 border border-[var(--border)] bg-[var(--surface)] overflow-y-auto">
          <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3">Palette</h4>
          <div className="grid grid-cols-5 gap-1">
            {questions.map((_, idx) => {
              const isCurrent = idx === currentQIndex;
              const ans = answers[idx];
              const status = ans.selected ? "answered" : ans.marked ? "marked" : "unanswered";
              return (
                <button
                  key={idx}
                  onClick={() => goToQuestion(idx)}
                  className={`h-7 text-xs font-medium transition-colors ${
                    isCurrent
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : status === "answered"
                      ? "bg-[var(--success)] text-[var(--background)]"
                      : status === "marked"
                      ? "bg-[var(--warning)] text-[var(--background)]"
                      : "bg-[var(--background)] text-[var(--text-muted)] border border-[var(--border)]"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[var(--success)]" />
              <span className="text-[var(--text-muted)]">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[var(--warning)]" />
              <span className="text-[var(--text-muted)]">Marked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 border border-[var(--border)]" />
              <span className="text-[var(--text-muted)]">Unanswered</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 p-4 border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex gap-2">
          <button onClick={prevQuestion} disabled={currentQIndex === 0} className="px-4 py-2 border border-[var(--border)] text-sm hover:border-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            Previous
          </button>
          <button onClick={toggleMark} className={`px-4 py-2 border text-sm transition-colors ${currentAns.marked ? "border-[var(--warning)] text-[var(--warning)]" : "border-[var(--border)]"}`}>
            {currentAns.marked ? "Unmark" : "Mark"}
          </button>
        </div>

        <div className="flex gap-2">
          {isLastQuestion ? (
            <button onClick={submitTest} className="px-6 py-2 border border-[var(--foreground)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors">
              Submit
            </button>
          ) : (
            <button
              onClick={() => {
                if (isLastInSection && !config.allowsSwitching) {
                  if (window.confirm(`Finish ${currentSection.name} and move to next section? You cannot return.`)) {
                    nextQuestion();
                  }
                } else {
                  nextQuestion();
                }
              }}
              className="px-6 py-2 border border-[var(--foreground)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
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
