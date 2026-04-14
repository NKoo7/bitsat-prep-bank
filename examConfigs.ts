// ─── Exam Configuration Registry ───────────────────────────────────────────
// Add new exams here. The engine adapts automatically.

export type ExamSubject = {
  id: string;
  label: string;
  questionCount: number; // default questions per section
};

export type ExamConfig = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  subjects: ExamSubject[];
  defaultQuestions: number;
  timePerQuestion: number; // seconds
  markingScheme: {
    correct: number;
    incorrect: number;
    unattempted: number;
  };
  difficulties: string[];
  badge: string; // emoji badge
};

export const EXAM_CONFIGS: Record<string, ExamConfig> = {
  BITSAT: {
    id: "BITSAT",
    name: "BITSAT",
    shortName: "BITSAT",
    description: "Birla Institute of Technology & Science Admission Test",
    subjects: [
      { id: "Physics", label: "Physics", questionCount: 10 },
      { id: "Chemistry", label: "Chemistry", questionCount: 10 },
      { id: "Mathematics", label: "Mathematics", questionCount: 10 },
      { id: "English & LR", label: "English & LR", questionCount: 5 },
    ],
    defaultQuestions: 15,
    timePerQuestion: 120,
    markingScheme: { correct: 3, incorrect: -1, unattempted: 0 },
    difficulties: ["easy", "medium", "hard", "adaptive"],
    badge: "⚡",
  },
  JEE_MAINS: {
    id: "JEE_MAINS",
    name: "JEE Mains",
    shortName: "JEE M",
    description: "Joint Entrance Examination — Mains",
    subjects: [
      { id: "Physics", label: "Physics", questionCount: 10 },
      { id: "Chemistry", label: "Chemistry", questionCount: 10 },
      { id: "Mathematics", label: "Mathematics", questionCount: 10 },
    ],
    defaultQuestions: 15,
    timePerQuestion: 120,
    markingScheme: { correct: 4, incorrect: -1, unattempted: 0 },
    difficulties: ["easy", "medium", "hard", "adaptive"],
    badge: "🎯",
  },
  JEE_ADVANCED: {
    id: "JEE_ADVANCED",
    name: "JEE Advanced",
    shortName: "JEE A",
    description: "Joint Entrance Examination — Advanced",
    subjects: [
      { id: "Physics", label: "Physics", questionCount: 10 },
      { id: "Chemistry", label: "Chemistry", questionCount: 10 },
      { id: "Mathematics", label: "Mathematics", questionCount: 10 },
    ],
    defaultQuestions: 15,
    timePerQuestion: 150,
    markingScheme: { correct: 4, incorrect: -2, unattempted: 0 },
    difficulties: ["medium", "hard", "adaptive"],
    badge: "🔥",
  },
  EAPCET: {
    id: "EAPCET",
    name: "EAPCET",
    shortName: "EAPCET",
    description: "Engineering, Agriculture & Pharmacy Common Entrance Test",
    subjects: [
      { id: "Physics", label: "Physics", questionCount: 10 },
      { id: "Chemistry", label: "Chemistry", questionCount: 10 },
      { id: "Mathematics", label: "Mathematics", questionCount: 10 },
    ],
    defaultQuestions: 15,
    timePerQuestion: 100,
    markingScheme: { correct: 1, incorrect: 0, unattempted: 0 },
    difficulties: ["easy", "medium", "hard", "adaptive"],
    badge: "📐",
  },
};

export const DEFAULT_EXAM = "BITSAT";

