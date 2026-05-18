import Link from "next/link";
import { MOCK_CONFIGS } from "@/lib/mock-data";

export default function MockSelectionPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Company Mock Tests</h1>
        <p className="text-[var(--text-secondary)]">
          Practice with realistic exam patterns based on actual company papers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_CONFIGS.map((mock) => (
          <Link
            key={mock.id}
            href={`/mock/${mock.id}`}
            className="block p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)] transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-semibold group-hover:text-[var(--accent)] transition-colors">
                {mock.name}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                mock.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                mock.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {mock.difficulty}
              </span>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {mock.description}
            </p>

            <div className="flex flex-wrap gap-3 text-sm">
              <div className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Questions:</span>{" "}
                <span className="font-medium">{mock.totalQuestions}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Time:</span>{" "}
                <span className="font-medium">{mock.totalMinutes} min</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Sections:</span>{" "}
                <span className="font-medium">{mock.sections.length}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
              {mock.negativeMarking ? (
                <span className="text-[var(--error)]">Negative marking</span>
              ) : (
                <span className="text-[var(--success)]">No negative marking</span>
              )}
              <span>|</span>
              {mock.allowsSwitching ? (
                <span>Section switching allowed</span>
              ) : (
                <span className="text-[var(--warning)]">No section switching</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <h3 className="font-semibold mb-2">How Mock Tests Work</h3>
        <ul className="text-sm text-[var(--text-secondary)] space-y-1.5 list-disc list-inside">
          <li>Questions are randomly selected from our question bank based on company patterns</li>
          <li>Timer runs automatically. Auto-submit when time ends</li>
          <li>TCS/Wipro/Cognizant mocks lock sections (cant switch back)</li>
          <li>Results show score, accuracy, time taken, and weak areas</li>
          <li>Each mock generates a unique question set every time</li>
        </ul>
      </div>
    </div>
  );
}
