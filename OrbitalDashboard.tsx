import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

type Props = {
  onStartTest: () => void;
};

function getMomentum(history: any[]): { label: string; level: "high" | "medium" | "low"; desc: string } {
  if (!history || history.length === 0) return { label: "—", level: "low", desc: "Take your first test" };
  const now = Date.now();
  const last7Days = history.filter(h => now - h._creationTime < 7 * 24 * 60 * 60 * 1000).length;
  if (last7Days >= 5) return { label: "High", level: "high", desc: `${last7Days} tests this week` };
  if (last7Days >= 2) return { label: "Medium", level: "medium", desc: `${last7Days} tests this week` };
  return { label: "Low", level: "low", desc: last7Days === 1 ? "1 test this week" : "No tests this week" };
}

function getSmartAction(stats: any, history: any[]): string {
  if (!stats || stats.totalTests === 0) return "Take your first test to get started.";
  const subjectEntries = Object.entries(stats.subjectStats as Record<string, { correct: number; total: number }>)
    .map(([s, d]) => ({ subject: s, acc: d.total > 0 ? d.correct / d.total : 0 }))
    .sort((a, b) => a.acc - b.acc);
  const weakest = subjectEntries[0];
  const avgScore = stats.totalMaxScore > 0 ? stats.totalScore / stats.totalMaxScore : 0;
  if (weakest && weakest.acc < 0.5) return `Focus on ${weakest.subject} — your accuracy is below 50%.`;
  if (avgScore < 0.6) return "Try a medium difficulty test to build confidence.";
  if (avgScore > 0.8) return "Push yourself — try a hard test next.";
  return "Keep the streak going with a fresh test.";
}

export default function OrbitalDashboard({ onStartTest }: Props) {
  const stats = useQuery(api.stats.getUserStats);
  const history = useQuery(api.stats.getTestHistory);

  const avgScore = stats && stats.totalMaxScore > 0
    ? Math.round((stats.totalScore / stats.totalMaxScore) * 100) : null;
  const bestScore = stats && stats.bestMaxScore > 0
    ? Math.round((stats.bestScore / stats.bestMaxScore) * 100) : null;

  const subjectEntries = stats
    ? Object.entries(stats.subjectStats as Record<string, { correct: number; total: number }>)
        .map(([subject, data]) => ({
          subject,
          accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
          total: data.total,
        }))
        .sort((a, b) => a.accuracy - b.accuracy)
    : [];

  const weakTopics = subjectEntries.slice(0, 3);
  const momentum = getMomentum(history ?? []);
  const smartAction = getSmartAction(stats, history ?? []);
  const hasData = stats && stats.totalTests > 0;

  const trendData = history
    ? [...history].reverse().slice(-10).map((h) => ({
        pct: Math.round((h.score / h.maxScore) * 100),
        date: new Date(h._creationTime).toLocaleDateString("en", { month: "short", day: "numeric" }),
      }))
    : [];

  const momentumColor = {
    high: "text-emerald-400",
    medium: "text-amber-400",
    low: "text-zinc-500",
  }[momentum.level];

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">

      {/* Greeting */}
      <div className="mb-10">
        <p className="text-zinc-500 text-sm font-medium mb-1 tracking-wide">
          {getGreeting()}
        </p>
        <h1 className="text-[2.25rem] font-bold tracking-tight leading-none">
          {hasData ? "Welcome back." : "Let's begin."}
        </h1>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white text-black rounded-2xl p-5">
          <p className="text-4xl font-bold tracking-tight leading-none mb-1">
            {avgScore !== null ? `${avgScore}%` : "—"}
          </p>
          <p className="text-xs text-zinc-500 font-medium mt-2">Average Score</p>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5">
          <p className="text-4xl font-bold tracking-tight leading-none mb-1">
            {bestScore !== null ? `${bestScore}%` : "—"}
          </p>
          <p className="text-xs text-zinc-500 font-medium mt-2">Personal Best</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-2xl font-bold tracking-tight">{stats?.totalTests ?? 0}</p>
          <p className="text-xs text-zinc-500 mt-1.5">Tests</p>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
          <p className={`text-2xl font-bold tracking-tight ${momentumColor}`}>{momentum.label}</p>
          <p className="text-xs text-zinc-500 mt-1.5">Momentum</p>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-2xl font-bold tracking-tight">
            {stats ? Math.round(stats.totalMaxScore / 3) : 0}
          </p>
          <p className="text-xs text-zinc-500 mt-1.5">Questions</p>
        </div>
      </div>

      {/* Smart next action */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-4">
        <p className="text-[10px] text-zinc-600 font-semibold tracking-[0.12em] uppercase mb-2">
          Suggested Next Step
        </p>
        <p className="text-sm text-zinc-300 leading-relaxed">{smartAction}</p>
      </div>

      {/* Score trend */}
      {trendData.length > 2 && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-4">
          <p className="text-[10px] text-zinc-600 font-semibold tracking-[0.12em] uppercase mb-4">
            Score Trend
          </p>
          <MiniSparkline data={trendData} />
        </div>
      )}

      {/* Weak topics */}
      {hasData && weakTopics.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-4">
          <p className="text-[10px] text-zinc-600 font-semibold tracking-[0.12em] uppercase mb-4">
            Needs Attention
          </p>
          <div className="space-y-3.5">
            {weakTopics.map((t) => (
              <div key={t.subject}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-zinc-300 font-medium">{t.subject}</span>
                  <span className={`text-xs font-semibold tabular-nums ${
                    t.accuracy >= 70 ? "text-emerald-400" : t.accuracy >= 40 ? "text-amber-400" : "text-red-400"
                  }`}>{t.accuracy}%</span>
                </div>
                <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      t.accuracy >= 70 ? "bg-emerald-500" : t.accuracy >= 40 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${t.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent tests */}
      {history && history.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-8">
          <p className="text-[10px] text-zinc-600 font-semibold tracking-[0.12em] uppercase mb-4">
            Recent Tests
          </p>
          <div className="space-y-0">
            {history.slice(0, 5).map((h, i) => {
              const pct = Math.round((h.score / h.maxScore) * 100);
              return (
                <div
                  key={h._id}
                  className={`flex items-center justify-between py-3 ${
                    i < Math.min(history.length, 5) - 1 ? "border-b border-white/[0.04]" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{h.subjects.join(" · ")}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {h.numQuestions}Q · {h.difficulty} · {new Date(h._creationTime).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold tabular-nums ${
                      pct >= 70 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-red-400"
                    }`}>{pct}%</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{h.score}/{h.maxScore}</p>
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
        className="w-full py-4 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-100 active:scale-[0.99] transition-all text-[15px] tracking-tight"
      >
        {hasData ? "Start New Test" : "Take Your First Test"}
      </button>

      {!hasData && (
        <p className="text-center text-zinc-700 text-xs mt-4 font-light">
          Complete a test to unlock your analytics.
        </p>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning.";
  if (h < 17) return "Good afternoon.";
  return "Good evening.";
}

function MiniSparkline({ data }: { data: { pct: number; date: string }[] }) {
  const max = Math.max(...data.map(d => d.pct), 100);
  const w = 100 / (data.length - 1);

  const points = data.map((d, i) => {
    const x = i * w;
    const y = 100 - (d.pct / max) * 75 - 10;
    return `${x},${y}`;
  }).join(" ");

  const lastPct = data[data.length - 1]?.pct ?? 0;
  const firstPct = data[0]?.pct ?? 0;
  const trend = lastPct - firstPct;

  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <span className="text-2xl font-bold">{lastPct}%</span>
        <span className={`text-xs font-medium ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% from start
        </span>
      </div>
      <svg viewBox="0 0 100 100" className="w-full h-16" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => {
          const x = i * w;
          const y = 100 - (d.pct / max) * 75 - 10;
          return i === data.length - 1 ? (
            <circle key={i} cx={x} cy={y} r="2.5" fill="white" />
          ) : null;
        })}
      </svg>
    </div>
  );
}
