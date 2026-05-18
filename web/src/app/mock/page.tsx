import Link from "next/link";
import { MOCK_CONFIGS } from "@/lib/mock-data";

export default function MockSelectionPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Company Mock Tests</h1>
        <p className="text-[var(--text-secondary)]">
          Practice with realistic exam patterns
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-[var(--border)]">
        {MOCK_CONFIGS.map((mock) => (
          <Link
            key={mock.id}
            href={`/mock/${mock.id}`}
            className="block p-6 bg-[var(--background)] hover:bg-[var(--surface)] transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-medium group-hover:opacity-80 transition-opacity">
                {mock.name}
              </h3>
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                {mock.difficulty}
              </span>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-6">
              {mock.description}
            </p>

            <div className="flex gap-4 text-sm text-[var(--text-muted)]">
              <span>{mock.totalQuestions} questions</span>
              <span>{mock.totalMinutes} minutes</span>
              <span>{mock.sections.length} sections</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-6 border border-[var(--border)]">
        <h3 className="text-sm font-medium uppercase tracking-wider mb-4 text-[var(--text-muted)]">How It Works</h3>
        <ul className="text-sm text-[var(--text-secondary)] space-y-2">
          <li>Questions selected from our bank based on company patterns</li>
          <li>Timer runs automatically. Auto-submit when time ends</li>
          <li>Some mocks lock sections — no going back</li>
          <li>Results show score, accuracy, time taken, and weak areas</li>
          <li>Each mock generates a unique question set every time</li>
        </ul>
      </div>
    </div>
  );
}
