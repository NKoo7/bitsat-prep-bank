import { useState } from "react";
import { TestConfig } from "./BITSATApp";

type Props = {
  onStart: (config: TestConfig) => void;
  onBack: () => void;
};

const SUBJECTS = ["Physics", "Chemistry", "Mathematics"];
const DIFFICULTIES = [
  { id: "easy", label: "Easy", desc: "Concept-based, straightforward" },
  { id: "medium", label: "Medium", desc: "Application & problem solving" },
  { id: "hard", label: "Hard", desc: "Multi-step, deep understanding" },
  { id: "adaptive", label: "Adaptive", desc: "Mixed based on BITSAT pattern" },
];
const QUESTION_COUNTS = [5, 10, 15, 20, 30];

export default function TestGenerator({ onStart, onBack }: Props) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["Physics", "Chemistry", "Mathematics"]);
  const [numQuestions, setNumQuestions] = useState(15);
  const [difficulty, setDifficulty] = useState("medium");

  const toggleSubject = (s: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? (prev.length > 1 ? prev.filter((x) => x !== s) : prev) : [...prev, s]
    );
  };

  const canStart = selectedSubjects.length > 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <button onClick={onBack} className="text-zinc-500 text-sm mb-8 hover:text-white transition-colors flex items-center gap-1">
        ← Back
      </button>

      <h1 className="text-3xl font-bold tracking-tight mb-1">New Test</h1>
      <p className="text-zinc-400 text-sm mb-10">Configure your practice session.</p>

      {/* Subjects */}
      <section className="mb-8">
        <p className="text-xs text-zinc-400 font-medium tracking-widest uppercase mb-3">Subjects</p>
        <div className="flex gap-2 flex-wrap">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSubject(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                selectedSubjects.includes(s)
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-zinc-400 border-white/10 hover:border-white/30"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Questions */}
      <section className="mb-8">
        <p className="text-xs text-zinc-400 font-medium tracking-widest uppercase mb-3">Questions</p>
        <div className="flex gap-2 flex-wrap">
          {QUESTION_COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => setNumQuestions(n)}
              className={`w-12 h-12 rounded-xl text-sm font-bold border transition-all ${
                numQuestions === n
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-zinc-400 border-white/10 hover:border-white/30"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      {/* Difficulty */}
      <section className="mb-10">
        <p className="text-xs text-zinc-400 font-medium tracking-widest uppercase mb-3">Difficulty</p>
        <div className="space-y-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                difficulty === d.id
                  ? "bg-white text-black border-white"
                  : "bg-transparent border-white/10 hover:border-white/20"
              }`}
            >
              <span className={`text-sm font-semibold ${difficulty === d.id ? "text-black" : "text-white"}`}>
                {d.label}
              </span>
              <span className={`text-xs ml-2 ${difficulty === d.id ? "text-zinc-600" : "text-zinc-500"}`}>
                {d.desc}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Summary */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-sm text-zinc-400">
        <span className="text-white font-medium">{numQuestions} questions</span> across{" "}
        <span className="text-white font-medium">{selectedSubjects.join(", ")}</span> ·{" "}
        <span className="text-white font-medium capitalize">{difficulty}</span> difficulty ·{" "}
        <span className="text-white font-medium">{Math.round(numQuestions * 2)} min</span> estimated
      </div>

      <button
        onClick={() => onStart({ subjects: selectedSubjects, numQuestions, difficulty })}
        disabled={!canStart}
        className="w-full py-4 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Generate Test →
      </button>
    </div>
  );
}
