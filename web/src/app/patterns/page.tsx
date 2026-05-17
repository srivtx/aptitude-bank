import { loadPatterns } from "@/lib/server-data";
import Link from "next/link";

export default function PatternsPage() {
  const patternsData = loadPatterns();

  if (!patternsData) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--text-secondary)]">No patterns data available.</p>
      </div>
    );
  }

  // Group patterns by subtopic
  const bySubtopic = new Map<string, typeof patternsData.patterns>();
  for (const p of patternsData.patterns) {
    if (!bySubtopic.has(p.subtopic)) {
      bySubtopic.set(p.subtopic, []);
    }
    bySubtopic.get(p.subtopic)!.push(p);
  }

  const frequencyOrder = { very_high: 0, high: 1, medium: 2, low: 3 };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Repeated Patterns</h1>
        <p className="text-[var(--text-secondary)]">
          {patternsData.metadata.total_patterns} recurring question templates detected from placement exams
        </p>
      </div>

      <div className="space-y-8">
        {Array.from(bySubtopic.entries()).map(([subtopic, patterns]) => (
          <div key={subtopic}>
            <h2 className="text-lg font-semibold mb-4 capitalize text-[var(--accent)]">
              {subtopic.replace(/_/g, ' ')}
            </h2>
            <div className="grid gap-4">
              {patterns
                .sort((a, b) => (frequencyOrder[a.frequency as keyof typeof frequencyOrder] ?? 4) - (frequencyOrder[b.frequency as keyof typeof frequencyOrder] ?? 4))
                .map((pattern) => (
                  <div
                    key={pattern.pattern_id}
                    className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-[var(--foreground)]">{pattern.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        pattern.frequency === 'very_high' ? 'bg-red-500/20 text-red-400' :
                        pattern.frequency === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {pattern.frequency.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">{pattern.template}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div className="p-3 rounded-lg bg-[var(--background)]">
                        <span className="text-xs text-[var(--text-muted)] block mb-1">Formula</span>
                        <code className="text-sm text-[var(--accent)]">{pattern.formula}</code>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--background)]">
                        <span className="text-xs text-[var(--text-muted)] block mb-1">Shortcut</span>
                        <span className="text-sm">{pattern.shortcut}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="text-[var(--text-muted)]">Asked by:</span>
                      {pattern.companies.map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
