import { useState } from "react";
import Dashboard from "./Dashboard";
import TestGenerator from "./TestGenerator";
import TestScreen from "./TestScreen";
import ResultsScreen from "./ResultsScreen";
import { SignOutButton } from "./SignOutButton";

export type Screen = "dashboard" | "generator" | "test" | "results";

export type TestConfig = {
  subjects: string[];
  numQuestions: number;
  difficulty: string;
};

export type Question = {
  subject: string;
  question: string;
  options: string[];
  correct_answer: string;
  solution: string;
  quick_trick: string;
  concept: string;
};

export type ResultQuestion = Question & {
  userAnswer: string | null;
  status: "correct" | "incorrect" | "unattempted";
  timeTaken: number;
  errorType?: "conceptual" | "calculation" | "time_pressure" | "none";
};

export type TestResult = {
  score: number;
  maxScore: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  results: ResultQuestion[];
  aiCoachFeedback: string;
  errorBreakdown: {
    conceptual: number;
    calculation: number;
    time_pressure: number;
  };
};

export default function BITSATApp() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setScreen("dashboard")}
            className="text-sm font-semibold tracking-widest text-white/90 hover:text-white transition-colors"
          >
            ⚡ BITSAT AI
          </button>
          <div className="flex items-center gap-4">
            {screen !== "dashboard" && screen !== "test" && (
              <button
                onClick={() => setScreen("dashboard")}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Dashboard
              </button>
            )}
            {screen !== "test" && <SignOutButton />}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="pt-14">
        {screen === "dashboard" && (
          <Dashboard onStartTest={() => setScreen("generator")} />
        )}
        {screen === "generator" && (
          <TestGenerator
            onStart={(config) => {
              setTestConfig(config);
              setScreen("test");
            }}
            onBack={() => setScreen("dashboard")}
          />
        )}
        {screen === "test" && testConfig && (
          <TestScreen
            config={testConfig}
            onComplete={(result) => {
              setTestResult(result);
              setScreen("results");
            }}
          />
        )}
        {screen === "results" && testResult && (
          <ResultsScreen
            result={testResult}
            onRetake={() => setScreen("generator")}
            onDashboard={() => setScreen("dashboard")}
          />
        )}
      </div>
    </div>
  );
}
