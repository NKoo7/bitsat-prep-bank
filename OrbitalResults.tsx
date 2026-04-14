import { useState } from "react";
import { TestResult, ResultQuestion } from "./OrbitalApp";

type Props = {
  result: TestResult;
  onRetake: () => void;
  onDashboard: () => void;
  onReplay: () => void;
};

export default function OrbitalResults({ result, onRetake, onDashboard, onReplay }: Props) {
  const [tab, setTab] = useState<"overview" | "solutions">("overview");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const pct = Math.round((result.score / result.maxScore) * 100);
  const grade = pct >= 85 ? "Excellent" : pct >= 70 ? "Good" : pct >= 50 ? "Average" : "Needs Work";
  const gradeColor = pct >= 85 ? "text-emerald-400" : pct >= 70 ? "text-blue-400" : pct >= 50 ? "text-amber-400" : "text-red-400";

  const subjectMap: Record<string, { correct: number; total: number; totalTime: number }> = {};
  for (const r of result.results) {
    if (!subjectMap[r.subject]) subjectMap[r.subject] = { correct: 0, total: 0, totalTime: 0 };
    subjectMap[r.subject].total += 1;
    subjectMap[r.subject].totalTime += r.timeTaken;
    if (r.status === "correct") subjectMap[r.subject].correct += 1;
  }

  const avgTime = Math.round(result.results.reduce((a, r) => a + r.timeTaken, 0) / result.results.length);
  const wrongCount = result.results.filter(r => r.status === "incorrect").length;

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">

      {/* Score hero */}
      <div className="mb-10">
        <div className="flex items-end gap-4 mb-3">
          <span className="text-[4.5rem] font-bold tracking-tighter leading-none">{pct}</span>
          <div className="pb-2">
            <span className="text-2xl text-zinc-600 font-light">%</span>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-sm font-semibold ${gradeColor}`}>{grade}</span>
          <span className="text-zinc-700 text-sm">·</span>
          <span className="text-zinc-500 text-sm">{result.score} / {result.maxScore} marks</span>
        </div>
        <div className="flex gap-5 text-sm">
          <span className="text-emerald-400 font-medium">{result.correct} correct</span>
          <span className="text-red-400 font-medium">{result.incorrect} wrong</span>
          <span className="text-zinc-600">{result.unattempted} skipped</span>
        </div>
      </div>

      {/* AI Coach */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-4">
        <p className="text-[10px] text-zinc-600 font-semibold tracking-[0.12em] uppercase mb-3">
          Coach Feedback
        </p>
        <p className="text-zinc-300 text-sm leading-relaxed">{result.aiCoachFeedback}</p>
      </div>

      {/* Instant Replay CTA */}
      {wrongCount > 0 && (
        <button
          onClick={onReplay}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 mb-4 text-left hover:border-white/15 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white mb-0.5">Instant Replay</p>
              <p className="text-xs text-zinc-500">Drill your {wrongCount} wrong question{wrongCount !== 1 ? "s" : ""} again</p>
            </div>
            <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">→</span>
          </div>
        </button>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 mb-6">
        {(["overview", "solutions"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize tracking-wide ${
              tab === t ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-3 mb-8">
          {/* Mistake patterns */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-[10px] text-zinc-600 font-semibold tracking-[0.12em] uppercase mb-4">
              Mistake Patterns
            </p>
            <div className="grid grid-cols-3 gap-3">
              <MistakeCard label="Conceptual" count={result.errorBreakdown.conceptual} color="text-red-400" />
              <MistakeCard label="Calculation" count={result.errorBreakdown.calculation} color="text-amber-400" />
              <MistakeCard label="Time Pressure" count={result.errorBreakdown.time_pressure} color="text-blue-400" />
            </div>
            {result.errorBreakdown.conceptual > result.errorBreakdown.calculation &&
             result.errorBreakdown.conceptual > result.errorBreakdown.time_pressure && (
              <p className="text-xs text-zinc-600 mt-4 leading-relaxed">
                Most errors are conceptual — review core theory before your next test.
              </p>
            )}
          </div>

          {/* Subject breakdown */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-[10px] text-zinc-600 font-semibold tracking-[0.12em] uppercase mb-4">
              By Subject
            </p>
            <div className="space-y-4">
              {Object.entries(subjectMap).map(([subject, data]) => {
                const acc = Math.round((data.correct / data.total) * 100);
                const avgT = Math.round(data.totalTime / data.total);
                return (
                  <div key={subject}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-zinc-300 font-medium">{subject}</span>
                      <div className="flex items-center gap-3 text-xs text-zinc-600">
                        <span>{data.correct}/{data.total}</span>
                        <span>~{avgT}s</span>
                        <span className={`font-semibold ${acc >= 70 ? "text-emerald-400" : acc >= 40 ? "text-amber-400" : "text-red-400"}`}>
                          {acc}%
                        </span>
                      </div>
                    </div>
                    <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${acc >= 70 ? "bg-emerald-500" : acc >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${acc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-[10px] text-zinc-600 font-semibold tracking-[0.12em] uppercase mb-4">
              Time Analysis
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{avgTime}s</p>
                <p className="text-xs text-zinc-600 mt-1">Avg per question</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {result.results.filter(r => r.timeTaken > 90).length}
                </p>
                <p className="text-xs text-zinc-600 mt-1">Questions over 90s</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "solutions" && (
        <div className="space-y-2 mb-8">
          {result.results.map((r, i) => (
            <SolutionCard
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
      <div className="flex gap-2.5">
        <button
          onClick={onDashboard}
          className="flex-1 py-3.5 rounded-2xl border border-white/[0.08] text-zinc-400 text-sm font-medium hover:border-white/15 hover:text-white transition-all"
        >
          Dashboard
        </button>
        <button
          onClick={onRetake}
          className="flex-1 py-3.5 rounded-2xl bg-white text-black text-sm font-semibold hover:bg-zinc-100 active:scale-[0.99] transition-all"
        >
          New Test →
        </button>
      </div>
    </div>
  );
}

function MistakeCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="bg-white/[0.03] rounded-xl p-3.5 text-center border border-white/[0.04]">
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
      <p className="text-[10px] text-zinc-600 mt-1 font-medium">{label}</p>
    </div>
  );
}

function SolutionCard({ r, idx, expanded, onToggle }: {
  r: ResultQuestion; idx: number; expanded: boolean; onToggle: () => void;
}) {
  const [showTrick, setShowTrick] = useState(false);
  const [showConcept, setShowConcept] = useState(false);

  const borderColor = r.status === "correct" ? "border-emerald-500/20" : r.status === "incorrect" ? "border-red-500/20" : "border-white/[0.06]";
  const bgColor = r.status === "correct" ? "bg-emerald-500/[0.03]" : r.status === "incorrect" ? "bg-red-500/[0.03]" : "bg-white/[0.02]";
  const statusText = r.status === "correct" ? "Correct" : r.status === "incorrect" ? "Wrong" : "Skipped";
  const statusColor = r.status === "correct" ? "text-emerald-400" : r.status === "incorrect" ? "text-red-400" : "text-zinc-600";

  return (
    <div className={`rounded-2xl border overflow-hidden ${borderColor} ${bgColor}`}>
      <button onClick={onToggle} className="w-full text-left p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-600 font-medium tabular-nums">Q{idx + 1}</span>
            <span className="text-xs text-zinc-600 bg-white/[0.04] px-2 py-0.5 rounded-md">{r.subject}</span>
            <span className={`text-xs font-semibold ${statusColor}`}>{statusText}</span>
          </div>
          <span className="text-zinc-700 text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
        <p className="text-zinc-400 text-sm mt-2 leading-relaxed line-clamp-2">{r.question}</p>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
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
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                      : isUser && !isCorrect
                      ? "bg-red-500/10 border-red-500/25 text-red-300"
                      : "bg-white/[0.03] border-white/[0.04] text-zinc-600"
                  }`}
                >
                  <span className="font-bold mr-1">{letter})</span>
                  {opt.replace(/^[A-D]\)\s*/, "")}
                  {isCorrect && <span className="ml-1">✓</span>}
                  {isUser && !isCorrect && <span className="ml-1">✗</span>}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-zinc-700">Time: {r.timeTaken}s</p>

          {/* Solution */}
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.04]">
            <p className="text-[10px] text-zinc-600 font-semibold tracking-[0.1em] uppercase mb-2">Solution</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{r.solution}</p>
          </div>

          {/* Quick trick */}
          <div>
            <button
              onClick={() => setShowTrick(v => !v)}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors font-medium"
            >
              {showTrick ? "▼" : "▶"} Quick Trick
            </button>
            {showTrick && (
              <div className="mt-2 bg-amber-500/[0.06] border border-amber-500/15 rounded-xl p-3">
                <p className="text-sm text-amber-200/80 leading-relaxed">{r.quick_trick}</p>
              </div>
            )}
          </div>

          {/* Concept */}
          <div>
            <button
              onClick={() => setShowConcept(v => !v)}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors font-medium"
            >
              {showConcept ? "▼" : "▶"} Concept Used
            </button>
            {showConcept && (
              <div className="mt-2 bg-blue-500/[0.06] border border-blue-500/15 rounded-xl p-3">
                <p className="text-sm text-blue-200/80 leading-relaxed">{r.concept}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
