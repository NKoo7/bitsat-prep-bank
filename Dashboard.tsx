import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

type Props = {
  onStartTest: () => void;
};

export default function Dashboard({ onStartTest }: Props) {
  const stats = useQuery(api.stats.getUserStats);
  const history = useQuery(api.stats.getTestHistory);

  const avgScore =
    stats && stats.totalMaxScore > 0
      ? Math.round((stats.totalScore / stats.totalMaxScore) * 100)
      : null;

  const bestScore =
    stats && stats.bestMaxScore > 0
      ? Math.round((stats.bestScore / stats.bestMaxScore) * 100)
      : null;

  // Compute weak/strong topics
  const subjectEntries = stats
    ? Object.entries(stats.subjectStats).map(([subject, data]) => ({
        subject,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        correct: data.correct,
        total: data.total,
      })).sort((a, b) => a.accuracy - b.accuracy)
    : [];

  const weakTopics = subjectEntries.filter((s) => s.accuracy < 60).slice(0, 5);
  const strongTopics = subjectEntries.filter((s) => s.accuracy >= 70);

  // Trend data from history
  const trendData = history
    ? [...history].reverse().slice(-8).map((h) => ({
        pct: Math.round((h.score / h.maxScore) * 100),
        label: new Date(h._creationTime).toLocaleDateString("en", { month: "short", day: "numeric" }),
      }))
    : [];

  const hasData = stats && stats.totalTests > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-zinc-400 text-sm">Your BITSAT performance at a glance.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Tests Taken" value={stats?.totalTests ?? 0} />
        <StatCard label="Avg Score" value={avgScore !== null ? `${avgScore}%` : "—"} />
        <StatCard label="Best Score" value={bestScore !== null ? `${bestScore}%` : "—"} highlight />
        <StatCard label="Questions" value={stats ? stats.totalMaxScore / 3 : 0} />
      </div>

      {/* Trend graph */}
      {trendData.length > 1 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <p className="text-xs text-zinc-400 font-medium mb-4 tracking-widest uppercase">Score Trend</p>
          <MiniGraph data={trendData} />
        </div>
      )}

      {/* Topics */}
      {hasData && (
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {weakTopics.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-xs text-zinc-400 font-medium mb-4 tracking-widest uppercase">Needs Work</p>
              <div className="space-y-3">
                {weakTopics.map((t) => (
                  <TopicBar key={t.subject} subject={t.subject} accuracy={t.accuracy} variant="weak" />
                ))}
              </div>
            </div>
          )}
          {strongTopics.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-xs text-zinc-400 font-medium mb-4 tracking-widest uppercase">Strong Areas</p>
              <div className="space-y-3">
                {strongTopics.map((t) => (
                  <TopicBar key={t.subject} subject={t.subject} accuracy={t.accuracy} variant="strong" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent tests */}
      {history && history.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
          <p className="text-xs text-zinc-400 font-medium mb-4 tracking-widest uppercase">Recent Tests</p>
          <div className="space-y-2">
            {history.slice(0, 5).map((h) => {
              const pct = Math.round((h.score / h.maxScore) * 100);
              return (
                <div key={h._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{h.subjects.join(", ")}</p>
                    <p className="text-xs text-zinc-500">
                      {h.numQuestions}Q · {h.difficulty} · {new Date(h._creationTime).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${pct >= 70 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-red-400"}`}>
                      {pct}%
                    </p>
                    <p className="text-xs text-zinc-500">{h.score}/{h.maxScore}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onStartTest}
        className="w-full py-4 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-100 transition-colors text-base tracking-tight"
      >
        {hasData ? "Start New Test" : "Take Your First Test"}
      </button>

      {!hasData && (
        <p className="text-center text-zinc-600 text-xs mt-4">
          Complete a test to see your analytics here.
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? "bg-white text-black border-white" : "bg-white/5 border-white/10"}`}>
      <p className={`text-2xl font-bold tracking-tight ${highlight ? "text-black" : "text-white"}`}>{value}</p>
      <p className={`text-xs mt-1 ${highlight ? "text-zinc-600" : "text-zinc-400"}`}>{label}</p>
    </div>
  );
}

function TopicBar({ subject, accuracy, variant }: { subject: string; accuracy: number; variant: "weak" | "strong" }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-300">{subject}</span>
        <span className={variant === "weak" ? "text-red-400" : "text-emerald-400"}>{accuracy}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${variant === "weak" ? "bg-red-500" : "bg-emerald-500"}`}
          style={{ width: `${accuracy}%` }}
        />
      </div>
    </div>
  );
}

function MiniGraph({ data }: { data: { pct: number; label: string }[] }) {
  const max = Math.max(...data.map((d) => d.pct), 100);
  const min = 0;
  const range = max - min || 1;
  const w = 100 / (data.length - 1);

  const points = data.map((d, i) => {
    const x = i * w;
    const y = 100 - ((d.pct - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="relative">
      <svg viewBox="0 0 100 100" className="w-full h-24" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
        {data.map((d, i) => {
          const x = i * w;
          const y = 100 - ((d.pct - min) / range) * 80 - 10;
          return (
            <circle key={i} cx={x} cy={y} r="2" fill="white" opacity="0.9" />
          );
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-zinc-600 text-xs">{d.pct}%</span>
        ))}
      </div>
    </div>
  );
}
