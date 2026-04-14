import { useState } from "react";
import { TestConfig } from "./OrbitalApp";

type Props = {
  onStart: (config: TestConfig) => void;
  onBack: () => void;
};

const SUBJECTS = ["Physics", "Chemistry", "Mathematics"];
const QUESTION_COUNTS = [10, 20, 30];
const DIFFICULTIES = [
  { id: "easy", label: "Easy", desc: "Concept-based, foundational" },
  { id: "medium", label: "Medium", desc: "Application & problem solving" },
  { id: "hard", label: "Hard", desc: "Multi-step, deep understanding" },
  { id: "adaptive", label: "Adaptive", desc: "Mixed, BITSAT-pattern" },
];

export default function OrbitalSetup({ onStart, onBack }: Props) {
  const [subjects, setSubjects] = useState<string[]>(["Physics", "Chemistry", "Mathematics"]);
  const [numQuestions, setNumQuestions] = useState(20);
  const [difficulty, setDifficulty] = useState("medium");

  const toggle = (s: string) => {
    setSubjects(prev =>
      prev.includes(s)
        ? prev.length > 1 ? prev.filter(x => x !== s) : prev
        : [...prev, s]
    );
  };

  const estTime = Math.round(numQuestions * 2);

  return (
    <div className="max-w-lg mx-auto px-5 py-10">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-zinc-500 text-sm mb-10 hover:text-white transition-colors font-medium"
      >
        <span>←</span>
        <span>Back</span>
      </button>

      <h1 className="text-[2rem] font-bold tracking-tight mb-1">New Test</h1>
      <p className="text-zinc-500 text-sm mb-10 font-light">Configure your session.</p>

      {/* Subjects */}
      <section className="mb-8">
        <Label>Subjects</Label>
        <div className="flex gap-2 flex-wrap">
          {SUBJECTS.map(s => (
            <button
              key={s}
              onClick={() => toggle(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                subjects.includes(s)
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-zinc-400 border-white/[0.08] hover:border-white/20 hover:text-zinc-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Questions */}
      <section className="mb-8">
        <Label>Questions</Label>
        <div className="flex gap-2">
          {QUESTION_COUNTS.map(n => (
            <button
              key={n}
              onClick={() => setNumQuestions(n)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
                numQuestions === n
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-zinc-400 border-white/[0.08] hover:border-white/20 hover:text-zinc-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      {/* Difficulty */}
      <section className="mb-10">
        <Label>Difficulty</Label>
        <div className="space-y-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all flex items-center justify-between ${
                difficulty === d.id
                  ? "bg-white border-white"
                  : "bg-transparent border-white/[0.08] hover:border-white/15"
              }`}
            >
              <div>
                <span className={`text-sm font-semibold ${difficulty === d.id ? "text-black" : "text-white"}`}>
                  {d.label}
                </span>
                <span className={`text-xs ml-2.5 ${difficulty === d.id ? "text-zinc-500" : "text-zinc-600"}`}>
                  {d.desc}
                </span>
              </div>
              {difficulty === d.id && (
                <span className="text-black text-xs font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Summary pill */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        <Pill>{numQuestions} questions</Pill>
        <span className="text-zinc-700 text-xs">·</span>
        <Pill>{subjects.join(", ")}</Pill>
        <span className="text-zinc-700 text-xs">·</span>
        <Pill className="capitalize">{difficulty}</Pill>
        <span className="text-zinc-700 text-xs">·</span>
        <Pill>~{estTime} min</Pill>
      </div>

      <button
        onClick={() => onStart({ subjects, numQuestions, difficulty })}
        className="w-full py-4 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-100 active:scale-[0.99] transition-all text-[15px] tracking-tight"
      >
        Generate Test →
      </button>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-zinc-600 font-semibold tracking-[0.12em] uppercase mb-3">
      {children}
    </p>
  );
}

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-xs text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg font-medium ${className}`}>
      {children}
    </span>
  );
}
