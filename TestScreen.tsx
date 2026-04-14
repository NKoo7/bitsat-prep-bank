import { useState, useEffect, useCallback, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { TestConfig, Question, TestResult } from "./BITSATApp";

type Props = {
  config: TestConfig;
  onComplete: (result: TestResult) => void;
};

export default function TestScreen({ config, onComplete }: Props) {
  const [phase, setPhase] = useState<"loading" | "test" | "submitting">("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.numQuestions * 2 * 60);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [questionStart, setQuestionStart] = useState(Date.now());
  const [totalStart] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);

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

  // Timer
  useEffect(() => {
    if (phase !== "test") return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft]);

  const recordQuestionTime = useCallback((idx: number) => {
    const elapsed = Math.round((Date.now() - questionStart) / 1000);
    setQuestionTimes((prev) => {
      const next = [...prev];
      next[idx] = (next[idx] ?? 0) + elapsed;
      return next;
    });
    setQuestionStart(Date.now());
  }, [questionStart]);

  const goTo = (idx: number) => {
    recordQuestionTime(current);
    setCurrent(idx);
  };

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    recordQuestionTime(current);
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
  }, [current, questions, answers, questionTimes, config.difficulty, totalStart, submitAndSaveTest, onComplete, recordQuestionTime]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-400">{error}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-zinc-400 hover:text-white">
          Reload
        </button>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-white font-medium">Generating your test…</p>
          <p className="text-zinc-500 text-sm mt-1">AI is crafting {config.numQuestions} questions</p>
        </div>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-white font-medium">Evaluating your answers…</p>
          <p className="text-zinc-500 text-sm mt-1">AI coach is preparing feedback</p>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const answered = answers.filter((a) => a !== null).length;
  const urgent = timeLeft < 120;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-zinc-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            {q.subject}
          </span>
          <span className="text-xs text-zinc-500">
            {current + 1} / {questions.length}
          </span>
        </div>
        <div className={`font-mono text-sm font-bold px-3 py-1 rounded-full border ${
          urgent ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-white border-white/10 bg-white/5"
        }`}>
          {formatTime(timeLeft)}
        </div>
        <span className="text-xs text-zinc-500">{answered}/{questions.length} done</span>
      </div>

      {/* Question */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
        <p className="text-white text-base leading-relaxed font-medium mb-6">{q.question}</p>
        <div className="space-y-2.5">
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
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                  selected
                    ? "bg-white text-black border-white"
                    : "bg-white/0 text-zinc-300 border-white/10 hover:border-white/25 hover:bg-white/5"
                }`}
              >
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-3 ${
                  selected ? "bg-black text-white" : "bg-white/10 text-zinc-400"
                }`}>
                  {letter}
                </span>
                {opt.replace(/^[A-D]\)\s*/, "")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Palette */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                i === current
                  ? "bg-white text-black"
                  : answers[i] !== null
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/5 text-zinc-500 border border-white/10 hover:border-white/25"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => goTo(Math.max(0, current - 1))}
          disabled={current === 0}
          className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 text-sm font-medium hover:border-white/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ← Prev
        </button>
        {current < questions.length - 1 ? (
          <button
            onClick={() => goTo(current + 1)}
            className="flex-1 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-100 transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-colors"
          >
            Submit ✓
          </button>
        )}
      </div>

      {current < questions.length - 1 && (
        <button
          onClick={handleSubmit}
          className="w-full mt-2 py-2.5 rounded-xl border border-white/10 text-zinc-500 text-xs font-medium hover:border-white/20 hover:text-zinc-300 transition-all"
        >
          Submit early ({answered}/{questions.length} answered)
        </button>
      )}
    </div>
  );
}
