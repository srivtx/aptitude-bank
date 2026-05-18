import { loadPatterns } from "@/lib/server-data";

export default function PatternsPage() {
  const patternsData = loadPatterns();

  if (!patternsData) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--text-secondary)]">No patterns data available.</p>
      </div>
    );
  }

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
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Repeated Patterns</h1>
        <p className="text-[var(--text-secondary)]">
          {patternsData.metadata.total_patterns} recurring question templates
        </p>
      </div>

      <div className="space-y-12">
        {Array.from(bySubtopic.entries()).map(([subtopic, patterns]) => (
          <div key={subtopic}>
            <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--text-muted)] mb-4">
              {subtopic.replace(/_/g, ' ')}
            </h2>
            <div className="space-y-[1px] bg-[var(--border)]">
              {patterns
                .sort((a, b) => (frequencyOrder[a.frequency as keyof typeof frequencyOrder] ?? 4) - (frequencyOrder[b.frequency as keyof typeof frequencyOrder] ?? 4))
                .map((pattern) => (
                  <div key={pattern.pattern_id} className="p-5 bg-[var(--background)] hover:bg-[var(--surface)] transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium">{pattern.name}</h3>
                      <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                        {pattern.frequency.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">{pattern.template}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
                      {pattern.formula && <span>Formula: {pattern.formula}</span>}
                      {pattern.shortcut && <span>Shortcut: {pattern.shortcut}</span>}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pattern.companies.map((c) => (
                        <span key={c} className="text-xs px-2 py-1 border border-[var(--border)] text-[var(--text-muted)]">
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
