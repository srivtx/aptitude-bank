import Link from "next/link";
import { loadTopicIndex } from "@/lib/server-data";

export default function HomePage() {
  const index = loadTopicIndex();

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-semibold tracking-tight mb-3">
          Placement Aptitude Bank
        </h1>
        <p className="text-[var(--text-secondary)] text-lg mb-8">
          {index.total_questions} questions across {index.total_topics} topics
        </p>
        <div className="flex gap-6 text-sm text-[var(--text-secondary)]">
          <span>Quant: {index.categories.quant}</span>
          <span>Reasoning: {index.categories.reasoning}</span>
          <span>Verbal: {index.categories.verbal}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[var(--border)]">
        {index.topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/topic/${topic.category}/${topic.id}`}
            className="block p-5 bg-[var(--background)] hover:bg-[var(--surface)] transition-colors group"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-[var(--foreground)] group-hover:opacity-80 transition-opacity">
                {topic.name}
              </h3>
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                {topic.category}
              </span>
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-3">
              {topic.total_questions} questions
            </p>
            <div className="flex gap-3 text-xs text-[var(--text-muted)]">
              {topic.difficulty_distribution.easy > 0 && <span>{topic.difficulty_distribution.easy} easy</span>}
              {topic.difficulty_distribution.medium > 0 && <span>{topic.difficulty_distribution.medium} medium</span>}
              {topic.difficulty_distribution.hard > 0 && <span>{topic.difficulty_distribution.hard} hard</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
