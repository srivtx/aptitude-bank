import Link from "next/link";
import { loadTopicIndex } from "@/lib/server-data";

export default function HomePage() {
  const index = loadTopicIndex();

  const categoryColors: Record<string, string> = {
    quant: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    reasoning: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    verbal: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  };

  const difficultyBadge = (count: number, level: string, color: string) => {
    if (count === 0) return null;
    return (
      <span key={level} className={`text-xs px-2 py-0.5 rounded-full ${color}`}>
        {count} {level}
      </span>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Placement Aptitude Research Bank</h1>
        <p className="text-[var(--text-secondary)] mb-4">
          {index.total_questions} questions across {index.total_topics} topics
        </p>
        <div className="flex gap-4 text-sm">
          <div className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <span className="text-[var(--text-muted)]">Quant:</span>{" "}
            <span className="font-medium">{index.categories.quant} topics</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <span className="text-[var(--text-muted)]">Reasoning:</span>{" "}
            <span className="font-medium">{index.categories.reasoning} topics</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <span className="text-[var(--text-muted)]">Verbal:</span>{" "}
            <span className="font-medium">{index.categories.verbal} topics</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {index.topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/topic/${topic.category}/${topic.id}`}
            className="block p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)] transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-lg group-hover:text-[var(--accent)] transition-colors">
                {topic.name}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[topic.category] || ""}`}>
                {topic.category}
              </span>
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-3">
              {topic.total_questions} questions
            </p>
            <div className="flex flex-wrap gap-2">
              {difficultyBadge(topic.difficulty_distribution.easy, "Easy", "bg-green-500/20 text-green-400")}
              {difficultyBadge(topic.difficulty_distribution.medium, "Medium", "bg-yellow-500/20 text-yellow-400")}
              {difficultyBadge(topic.difficulty_distribution.hard, "Hard", "bg-red-500/20 text-red-400")}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
