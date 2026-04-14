import { useState } from "react";
import { TestResult, ResultQuestion } from "./BITSATApp";

type Props = {
  result: TestResult;
  onRetake: () => void;
  onDashboard: () => void;
};

export default function ResultsScreen({ result, onRetake, onDashboard }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"analytics" | "solutions">("analytics");

  const pct = Math.round((result.score / result.maxScore) * 100);

  const subjectMap: Record<string, { correct: number; total: number; avgTime: number; totalTime: number }> = {};
  for (const r of result.results) {
    if (!subjectMap[r.subject]) subjectMap[r.subject] = { correct: 0, total: 0, avgTime: 0, totalTime: 0 };
    subjectMap[r.subject].total += 1;
    subjectMap[r.subject].totalTime += r.timeTaken;
    if (r.status === "correct") subjectMap[r.subject].correct += 1;
  }
  for (const s of Object.values(subjectMap)) {
    s.avgTime = Math.round(s.totalTime / s.total);
  }

  const avgTime = Math.round(
    result.results.reduce((a, r) => a + r.timeTaken, 0) / result.results.length
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Score hero */}
      <div className="text-center mb-10">
        <div className="text-6xl font-bold tracking-tighter mb-1">
          {pct}<span className="text-2xl text-zinc-500">%</span>
        </div>
        <p className="text-zinc-400 text-sm mb-4">
          {result.score} / {result.maxScore} marks
        </p>
        <div className="flex justify-center gap-6 text-sm">
          <span className="text-emerald-400 font-semibold">✓ {result.correct} correct</span>
          <span className="text-red-400 font-semibold">✗ {result.incorrect} wrong</span>
          <span className="text-zinc-500">— {result.unattempted} skipped</span>
        </div>
      </div>

      {/* AI Coach */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
        <p className="text-xs text-zinc-400 font-medium tracking-widest uppercase mb-3">AI Coach</p>
        <p className="text-zinc-200 text-sm leading-relaxed">{result.aiCoachFeedback}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6">
        {(["analytics", "solutions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab ? "bg-white text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "analytics" && (
        <div className="space-y-4 mb-8">
          {/* Error breakdown */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-zinc-400 font-medium tracking-widest uppercase mb-4">Mistake Patterns</p>
            <div className="grid grid-cols-3 gap-3">
              <ErrorCard label="Conceptual" count={result.errorBreakdown.conceptual} color="text-red-400" />
              <ErrorCard label="Calculation" count={result.errorBreakdown.calculation} color="text-amber-400" />
              <ErrorCard label="Time Pressure" count={result.errorBreakdown.time_pressure} color="text-blue-400" />
            </div>
          </div>

          {/* Subject breakdown */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-zinc-400 font-medium tracking-widest uppercase mb-4">Subject Breakdown</p>
            <div className="space-y-4">
              {Object.entries(subjectMap).map(([subject, data]) => {
                const acc = Math.round((data.correct / data.total) * 100);
                return (
                  <div key={subject}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-zinc-300 font-medium">{subject}</span>
                      <div className="flex gap-3 text-xs text-zinc-500">
                        <span>{data.correct}/{data.total}</span>
                        <span>~{data.avgTime}s/q</span>
                        <span className={acc >= 70 ? "text-emerald-400" : acc >= 40 ? "text-amber-400" : "text-red-400"}>
                          {acc}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${acc >= 70 ? "bg-emerald-500" : acc >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${acc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time stats */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-zinc-400 font-medium tracking-widest uppercase mb-4">Time Analysis</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold">{avgTime}s</p>
                <p className="text-xs text-zinc-500 mt-0.5">Avg per question</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {result.results.filter((r) => r.timeTaken > 90).length}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">{"Questions >90s"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "solutions" && (
        <div className="space-y-3 mb-8">
          {result.results.map((r, i) => (
            <QuestionCard
              key={i}
              r={r}
              idx={i}
              expanded={expandedIdx === i}
              onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onDashboard}
          className="flex-1 py-3.5 rounded-2xl border border-white/10 text-zinc-300 text-sm font-medium hover:border-white/25 hover:text-white transition-all"
        >
          Dashboard
        </button>
        <button
          onClick={onRetake}
          className="flex-1 py-3.5 rounded-2xl bg-white text-black text-sm font-semibold hover:bg-zinc-100 transition-colors"
        >
          New Test →
        </button>
      </div>
    </div>
  );
}

function ErrorCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}

function QuestionCard({
  r, idx, expanded, onToggle,
}: {
  r: ResultQuestion;
  idx: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [showTrick, setShowTrick] = useState(false);
  const [showConcept, setShowConcept] = useState(false);

  const statusColor =
    r.status === "correct" ? "border-emerald-500/30 bg-emerald-500/5"
    : r.status === "incorrect" ? "border-red-500/30 bg-red-500/5"
    : "border-white/10 bg-white/5";

  const statusLabel =
    r.status === "correct" ? "✓ Correct"
    : r.status === "incorrect" ? "✗ Incorrect"
    : "— Skipped";

  const statusTextColor =
    r.status === "correct" ? "text-emerald-400"
    : r.status === "incorrect" ? "text-red-400"
    : "text-zinc-500";

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${statusColor}`}>
      <button
        onClick={onToggle}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-500 font-medium">Q{idx + 1}</span>
            <span className="text-xs text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full">{r.subject}</span>
            <span className={`text-xs font-semibold ${statusTextColor}`}>{statusLabel}</span>
            {r.errorType && r.errorType !== "none" && (
              <span className="text-xs text-zinc-600 bg-white/5 px-2 py-0.5 rounded-full capitalize">
                {r.errorType.replace("_", " ")}
              </span>
            )}
          </div>
          <span className="text-zinc-500 text-xs shrink-0">{expanded ? "▲" : "▼"}</span>
        </div>
        <p className="text-zinc-300 text-sm mt-2 leading-relaxed line-clamp-2">{r.question}</p>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {r.options.map((opt, j) => {
              const letter = ["A", "B", "C", "D"][j];
              const isCorrect = letter === r.correct_answer;
              const isUser = letter === r.userAnswer;
              return (
                <div
                  key={j}
                  className={`text-xs px-3 py-2 rounded-lg border font-medium ${
                    isCorrect
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : isUser && !isCorrect
                      ? "bg-red-500/10 border-red-500/30 text-red-300"
                      : "bg-white/5 border-white/5 text-zinc-500"
                  }`}
                >
                  <span className="font-bold mr-1">{letter})</span>
                  {opt.replace(/^[A-D]\)\s*/, "")}
                  {isCorrect && <span className="ml-1 text-emerald-400">✓</span>}
                  {isUser && !isCorrect && <span className="ml-1 text-red-400">✗</span>}
                </div>
              );
            })}
          </div>

          {/* Time */}
          <p className="text-xs text-zinc-600">Time spent: {r.timeTaken}s</p>

          {/* Solution */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <p className="text-xs text-zinc-400 font-medium mb-2 tracking-widest uppercase">Solution</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{r.solution}</p>
          </div>

          {/* Quick trick toggle */}
          <div>
            <button
              onClick={() => setShowTrick((v) => !v)}
              className="text-xs text-zinc-400 hover:text-white transition-colors font-medium"
            >
              {showTrick ? "▼" : "▶"} Quick Trick
            </button>
            {showTrick && (
              <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-sm text-amber-200 leading-relaxed">{r.quick_trick}</p>
              </div>
            )}
          </div>

          {/* Concept toggle */}
          <div>
            <button
              onClick={() => setShowConcept((v) => !v)}
              className="text-xs text-zinc-400 hover:text-white transition-colors font-medium"
            >
              {showConcept ? "▼" : "▶"} Concept Used
            </button>
            {showConcept && (
              <div className="mt-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-sm text-blue-200 leading-relaxed">{r.concept}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
