import { useState } from "react";
import OrbitalDashboard from "./OrbitalDashboard";
import OrbitalSetup from "./OrbitalSetup";
import OrbitalTest from "./OrbitalTest";
import OrbitalResults from "./OrbitalResults";
import OrbitalReplay from "./OrbitalReplay";
import { SignOutButton } from "./SignOutButton";

export type Screen = "dashboard" | "setup" | "test" | "results" | "replay";

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

export default function OrbitalApp() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const navigate = (s: Screen) => setScreen(s);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header — hidden during test */}
      {screen !== "test" && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-2xl border-b border-white/[0.04]">
          <div className="max-w-3xl mx-auto px-5 h-[52px] flex items-center justify-between">
            <button
              onClick={() => navigate("dashboard")}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                <span className="text-black font-black text-xs">O</span>
              </div>
              <span className="text-sm font-semibold tracking-tight text-white/80 group-hover:text-white transition-colors">
                Orbital
              </span>
            </button>
            <div className="flex items-center gap-5">
              {screen !== "dashboard" && (
                <button
                  onClick={() => navigate("dashboard")}
                  className="text-xs text-zinc-500 hover:text-white transition-colors font-medium"
                >
                  Dashboard
                </button>
              )}
              <SignOutButton />
            </div>
          </div>
        </header>
      )}

      {/* Content */}
      <div className={screen !== "test" ? "pt-[52px]" : ""}>
        {screen === "dashboard" && (
          <div className="page-enter">
            <OrbitalDashboard
              onStartTest={() => navigate("setup")}
            />
          </div>
        )}
        {screen === "setup" && (
          <div className="page-enter">
            <OrbitalSetup
              onStart={(config) => {
                setTestConfig(config);
                navigate("test");
              }}
              onBack={() => navigate("dashboard")}
            />
          </div>
        )}
        {screen === "test" && testConfig && (
          <OrbitalTest
            config={testConfig}
            onComplete={(result) => {
              setTestResult(result);
              navigate("results");
            }}
          />
        )}
        {screen === "results" && testResult && (
          <div className="page-enter">
            <OrbitalResults
              result={testResult}
              onRetake={() => navigate("setup")}
              onDashboard={() => navigate("dashboard")}
              onReplay={() => navigate("replay")}
            />
          </div>
        )}
        {screen === "replay" && testResult && (
          <div className="page-enter">
            <OrbitalReplay
              result={testResult}
              onDone={() => navigate("results")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
