import { useState } from "react";
import { TestResult, ResultQuestion } from "./OrbitalApp";

type Props = {
  result: TestResult;
  onDone: () => void;
};

export default function OrbitalReplay({ result, onDone }: Props) {
  const wrongQuestions = result.results.filter(r => r.status === "incorrect" || r.status === "unattempted");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(new Array(wrongQuestions.length).fill(null));
  const [revealed, setRevealed] = useState<boolean[]>(new Array(wrongQuestions.length).fill(false));
  const [done, setDone] = useState(false);

  if (wrongQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-5">
        <p className="text-2xl font-bold">Perfect score!</p>
        <p className="text-zinc-500 text-sm">No wrong answers to replay.</p>
        <button onClick={onDone} className="mt-4 px-6 py-3 bg-white text-black rounded-xl font-semibold text-sm">
          Back to Results
        </button>
      </div>
    );
  }

  if (done) {
    const correct = answers.filter((a, i) => a === wrongQuestions[i].correct_answer).length;
    const pct = Math.round((correct / wrongQuestions.length) * 100);
    return (
      <div className="max-w-lg mx-auto px-5 py-16 text-center page-enter">
        <p className="text-[10px] text-zinc-600 font-semibold tracking-[0.12em] uppercase mb-6">Replay Complete</p>
        <p className="text-6xl font-bold tracking-tight mb-2">{pct}%</p>
        <p className="text-zinc-500 text-sm mb-8">{correct} / {wrongQuestions.length} correct on replay</p>
        {pct >= 70 ? (
          <p className="text-emerald-400 text-sm mb-8">Great improvement! Keep drilling.</p>
        ) : (
          <p className="text-amber-400 text-sm mb-8">Review the solutions and try again.</p>
        )}
        <button
          onClick={onDone}
          className="w-full py-4 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-100 transition-all text-[15px]"
        >
          Back to Results
        </button>
      </div>
    );
  }

  const q = wrongQuestions[current];
  const isRevealed = revealed[current];
  const userAnswer = answers[current];
  const progress = ((current + 1) / wrongQuestions.length) * 100;

  const handleReveal = () => {
    const next = [...revealed];
    next[current] = true;
    setRevealed(next);
  };

  const handleNext = () => {
    if (current < wrongQuestions.length - 1) {
      setCurrent(current + 1);
    } else {
      setDone(true);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="h-[2px] bg-white/[0.06]">
          <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="max-w-2xl mx-auto px-5 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
              Replay
            </span>
            <span className="text-xs text-zinc-600 font-medium">{current + 1} / {wrongQuestions.length}</span>
          </div>
          <button onClick={onDone} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Exit
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 pt-20 pb-8">
        <div className="page-enter" key={current}>
          {/* Subject tag */}
          <p className="text-xs text-zinc-600 font-medium mb-4">{q.subject}</p>

          {/* Question */}
          <p className="text-white text-[17px] leading-relaxed font-medium mb-8">{q.question}</p>

          {/* Options */}
          <div className="space-y-2.5 mb-6">
            {q.options.map((opt, i) => {
              const letter = ["A", "B", "C", "D"][i];
              const selected = userAnswer === letter;
              const isCorrect = letter === q.correct_answer;
              const showResult = isRevealed;

              return (
                <button
                  key={i}
                  onClick={() => {
                    if (!isRevealed) {
                      const next = [...answers];
                      next[current] = selected ? null : letter;
                      setAnswers(next);
                    }
                  }}
                  disabled={isRevealed}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                    showResult && isCorrect
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : showResult && selected && !isCorrect
                      ? "bg-red-500/10 border-red-500/30"
                      : selected
                      ? "bg-white border-white"
                      : "bg-white/[0.02] border-white/[0.07] hover:border-white/20 hover:bg-white/[0.04]"
                  } ${isRevealed ? "cursor-default" : ""}`}
                >
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold shrink-0 ${
                    showResult && isCorrect ? "bg-emerald-500 text-white"
                    : showResult && selected && !isCorrect ? "bg-red-500 text-white"
                    : selected ? "bg-black text-white"
                    : "bg-white/[0.06] text-zinc-500"
                  }`}>
                    {letter}
                  </span>
                  <span className={`text-sm leading-relaxed ${
                    showResult && isCorrect ? "text-emerald-300 font-medium"
                    : showResult && selected && !isCorrect ? "text-red-300"
                    : selected ? "text-black font-medium"
                    : "text-zinc-300"
                  }`}>
                    {opt.replace(/^[A-D]\)\s*/, "")}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Reveal / Solution */}
          {!isRevealed ? (
            <button
              onClick={handleReveal}
              className="w-full py-3.5 rounded-xl border border-white/[0.08] text-zinc-400 text-sm font-medium hover:border-white/15 hover:text-white transition-all mb-3"
            >
              Reveal Answer
            </button>
          ) : (
            <div className="space-y-3 mb-3">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <p className="text-[10px] text-zinc-600 font-semibold tracking-[0.1em] uppercase mb-2">Solution</p>
                <p className="text-sm text-zinc-300 leading-relaxed">{q.solution}</p>
              </div>
              <div className="bg-amber-500/[0.05] border border-amber-500/15 rounded-xl p-3">
                <p className="text-[10px] text-amber-600 font-semibold tracking-[0.1em] uppercase mb-1.5">Quick Trick</p>
                <p className="text-sm text-amber-200/80 leading-relaxed">{q.quick_trick}</p>
              </div>
            </div>
          )}

          {isRevealed && (
            <button
              onClick={handleNext}
              className="w-full py-4 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-100 active:scale-[0.99] transition-all text-[15px]"
            >
              {current < wrongQuestions.length - 1 ? "Next →" : "Finish Replay →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
