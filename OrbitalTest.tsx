import { useState, useEffect, useCallback, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { TestConfig, Question, TestResult } from "./OrbitalApp";

type Props = {
  config: TestConfig;
  onComplete: (result: TestResult) => void;
};

export default function OrbitalTest({ config, onComplete }: Props) {
  const [phase, setPhase] = useState<"loading" | "test" | "submitting">("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.numQuestions * 2 * 60);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [questionStart, setQuestionStart] = useState(Date.now());
  const [totalStart] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const generateTest = useAction(api.questions.generateTest);
  const submitAndSaveTest = useAction(api.questions.submitAndSaveTest);
  const submittingRef = useRef(false);

  useEffect(() => {
    generateTest({
      subjects: config.subjects,
      numQuestions: config.numQuestions,
      difficulty: config.difficulty,
    })
      .then((qs) => {
        setQuestions(qs as Question[]);
        setAnswers(new Array(qs.length).fill(null));
        setQuestionTimes(new Array(qs.length).fill(0));
        setPhase("test");
        setQuestionStart(Date.now());
      })
      .catch(() => {
        setError("Failed to generate questions. Please try again.");
        setPhase("loading");
      });
  }, []);

  useEffect(() => {
    if (phase !== "test") return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft]);

  const recordTime = useCallback((idx: number) => {
    const elapsed = Math.round((Date.now() - questionStart) / 1000);
    setQuestionTimes(prev => {
      const next = [...prev];
      next[idx] = (next[idx] ?? 0) + elapsed;
      return next;
    });
    setQuestionStart(Date.now());
  }, [questionStart]);

  const goTo = (idx: number) => {
    recordTime(current);
    setCurrent(idx);
    setAnimKey(k => k + 1);
    setShowPalette(false);
  };

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    recordTime(current);
    setPhase("submitting");
    const totalTimeTaken = Math.round((Date.now() - totalStart) / 1000);
    try {
      const res = await submitAndSaveTest({
        questions,
        answers,
        questionTimes,
        difficulty: config.difficulty,
        totalTimeTaken,
      });
      onComplete(res as TestResult);
    } catch {
      setError("Submission failed. Please try again.");
      setPhase("test");
      submittingRef.current = false;
    }
  }, [current, questions, answers, questionTimes, config.difficulty, totalStart, submitAndSaveTest, onComplete, recordTime]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-5">
        <p className="text-zinc-400 text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="text-xs text-zinc-600 hover:text-white transition-colors">
          Reload page
        </button>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center orbital-pulse">
            <span className="text-black font-black text-xl">O</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-base mb-1">Generating your test</p>
          <p className="text-zinc-600 text-sm font-light">
            {config.numQuestions} {config.difficulty} questions · {config.subjects.join(", ")}
          </p>
        </div>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center orbital-pulse">
          <span className="text-black font-black text-xl">O</span>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-base mb-1">Evaluating answers</p>
          <p className="text-zinc-600 text-sm font-light">AI coach is preparing your feedback</p>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const answered = answers.filter(a => a !== null).length;
  const urgent = timeLeft < 120;
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className={`min-h-screen bg-black transition-all duration-300 ${focusMode ? "bg-black" : ""}`}>
      {/* Top bar */}
      {!focusMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-b border-white/[0.04]">
          {/* Progress bar */}
          <div className="h-[2px] bg-white/[0.06]">
            <div
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="max-w-2xl mx-auto px-5 h-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-zinc-500 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                {q.subject}
              </span>
              <span className="text-xs text-zinc-600 font-medium tabular-nums">
                {current + 1} / {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-mono text-sm font-bold tabular-nums ${urgent ? "text-red-400" : "text-zinc-400"}`}>
                {fmt(timeLeft)}
              </span>
              <button
                onClick={() => setFocusMode(true)}
                className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors font-medium tracking-wide uppercase"
              >
                Focus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Focus mode bar */}
      {focusMode && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3">
          <span className="text-xs text-zinc-700 tabular-nums font-mono">{current + 1}/{questions.length}</span>
          <span className={`text-xs font-mono font-bold tabular-nums ${urgent ? "text-red-400" : "text-zinc-700"}`}>
            {fmt(timeLeft)}
          </span>
          <button onClick={() => setFocusMode(false)} className="text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors uppercase tracking-wide">
            Exit Focus
          </button>
        </div>
      )}

      {/* Question */}
      <div className={`max-w-2xl mx-auto px-5 ${focusMode ? "pt-16 pb-8" : "pt-20 pb-8"}`}>
        <div key={animKey} className="page-enter">
          {/* Question text */}
          <div className="mb-8">
            <p className="text-white text-[17px] leading-relaxed font-medium">{q.question}</p>
          </div>

          {/* Options */}
          <div className="space-y-2.5 mb-8">
            {q.options.map((opt, i) => {
              const letter = ["A", "B", "C", "D"][i];
              const selected = answers[current] === letter;
              return (
                <button
                  key={i}
                  onClick={() => {
                    const next = [...answers];
                    next[current] = selected ? null : letter;
                    setAnswers(next);
                  }}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all flex items-center gap-3 group ${
                    selected
                      ? "bg-white border-white"
                      : "bg-white/[0.02] border-white/[0.07] hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    selected ? "bg-black text-white" : "bg-white/[0.06] text-zinc-500 group-hover:bg-white/10"
                  }`}>
                    {letter}
                  </span>
                  <span className={`text-sm leading-relaxed ${selected ? "text-black font-medium" : "text-zinc-300"}`}>
                    {opt.replace(/^[A-D]\)\s*/, "")}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex gap-2.5 mb-3">
            <button
              onClick={() => current > 0 && goTo(current - 1)}
              disabled={current === 0}
              className="flex-1 py-3.5 rounded-xl border border-white/[0.08] text-zinc-500 text-sm font-medium hover:border-white/20 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>
            {current < questions.length - 1 ? (
              <button
                onClick={() => goTo(current + 1)}
                className="flex-1 py-3.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-100 active:scale-[0.99] transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex-1 py-3.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-100 active:scale-[0.99] transition-all"
              >
                Submit →
              </button>
            )}
          </div>

          {/* Question palette toggle */}
          {!focusMode && (
            <button
              onClick={() => setShowPalette(v => !v)}
              className="w-full py-2.5 rounded-xl border border-white/[0.06] text-zinc-600 text-xs font-medium hover:border-white/10 hover:text-zinc-400 transition-all"
            >
              {showPalette ? "Hide" : "Show"} question map · {answered}/{questions.length} answered
            </button>
          )}

          {/* Palette */}
          {showPalette && !focusMode && (
            <div className="mt-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="flex flex-wrap gap-1.5">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      i === current
                        ? "bg-white text-black"
                        : answers[i] !== null
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                        : "bg-white/[0.04] text-zinc-600 border border-white/[0.06] hover:border-white/15"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Early submit */}
          {current < questions.length - 1 && !focusMode && (
            <button
              onClick={handleSubmit}
              className="w-full mt-2 py-2 text-zinc-700 text-xs font-medium hover:text-zinc-500 transition-colors"
            >
              Submit early
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
