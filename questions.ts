"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

export const generateTest = action({
  args: {
    subjects: v.array(v.string()),
    numQuestions: v.number(),
    difficulty: v.string(),
  },
  handler: async (ctx, args) => {
    const { subjects, numQuestions, difficulty } = args;

    const perSubject = Math.floor(numQuestions / subjects.length);
    const remainder = numQuestions % subjects.length;

    const subjectLines = subjects.map((s, i) =>
      `- ${perSubject + (i < remainder ? 1 : 0)} ${s} questions`
    ).join("\n");

    const difficultyNote =
      difficulty === "easy" ? "straightforward, concept-testing questions suitable for beginners"
      : difficulty === "medium" ? "moderately challenging questions requiring application of concepts"
      : difficulty === "hard" ? "highly challenging, multi-step problems requiring deep understanding"
      : "a mix of easy, medium, and hard questions based on typical BITSAT difficulty distribution";

    const prompt = `You are an expert BITSAT question setter. Generate exactly ${numQuestions} BITSAT-level multiple choice questions:
${subjectLines}

Difficulty: ${difficultyNote}

Each question must be unique, accurate, and appropriate for BITSAT (engineering entrance exam).

Return a JSON array of exactly ${numQuestions} objects. Each object must have:
{
  "subject": one of ${JSON.stringify(subjects)},
  "question": "the question text (use plain text, no LaTeX)",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct_answer": "A" | "B" | "C" | "D",
  "solution": "detailed step-by-step explanation of the correct answer",
  "quick_trick": "a short memory trick or shortcut to solve this type of question faster",
  "concept": "the core concept or formula being tested (1-2 sentences)"
}

Return ONLY the JSON array, no markdown, no extra text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content ?? "[]";
    const questions = JSON.parse(content);
    return questions;
  },
});

export const submitAndSaveTest = action({
  args: {
    questions: v.array(
      v.object({
        subject: v.string(),
        question: v.string(),
        options: v.array(v.string()),
        correct_answer: v.string(),
        solution: v.string(),
        quick_trick: v.string(),
        concept: v.string(),
      })
    ),
    answers: v.array(v.union(v.string(), v.null())),
    questionTimes: v.array(v.number()),
    difficulty: v.string(),
    totalTimeTaken: v.number(),
  },
  handler: async (ctx, args) => {
    const { questions, answers, questionTimes, difficulty, totalTimeTaken } = args;
    const userId = await getAuthUserId(ctx);

    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    const results = questions.map((q, i) => {
      const userAnswer = answers[i];
      const timeTaken = questionTimes[i] ?? 0;
      let status: "correct" | "incorrect" | "unattempted";
      let errorType: "conceptual" | "calculation" | "time_pressure" | "none" | undefined;

      if (userAnswer === null || userAnswer === undefined) {
        status = "unattempted";
        unattempted++;
        errorType = timeTaken > 60 ? "time_pressure" : undefined;
      } else if (userAnswer === q.correct_answer) {
        status = "correct";
        correct++;
        errorType = "none";
      } else {
        status = "incorrect";
        incorrect++;
        // Heuristic error classification
        if (timeTaken < 20) {
          errorType = "conceptual";
        } else if (timeTaken > 90) {
          errorType = "time_pressure";
        } else {
          errorType = "calculation";
        }
      }

      return {
        ...q,
        userAnswer: userAnswer ?? null,
        status,
        timeTaken,
        errorType,
      };
    });

    const score = correct * 3 - incorrect * 1;
    const maxScore = questions.length * 3;
    const subjects = [...new Set(questions.map((q) => q.subject))];

    // Generate AI coach feedback
    const subjectBreakdown = subjects.map((s) => {
      const sq = results.filter((r) => r.subject === s);
      const sc = sq.filter((r) => r.status === "correct").length;
      return `${s}: ${sc}/${sq.length} correct`;
    }).join(", ");

    const errorBreakdown = {
      conceptual: results.filter((r) => r.errorType === "conceptual").length,
      calculation: results.filter((r) => r.errorType === "calculation").length,
      time_pressure: results.filter((r) => r.errorType === "time_pressure").length,
    };

    const coachPrompt = `You are an expert BITSAT coach. A student just completed a practice test.

Results:
- Score: ${score}/${maxScore} (${Math.round((score / maxScore) * 100)}%)
- Correct: ${correct}, Incorrect: ${incorrect}, Unattempted: ${unattempted}
- Subject breakdown: ${subjectBreakdown}
- Error types: ${errorBreakdown.conceptual} conceptual, ${errorBreakdown.calculation} calculation, ${errorBreakdown.time_pressure} time pressure errors
- Average time per question: ${Math.round(totalTimeTaken / questions.length)}s
- Difficulty: ${difficulty}

Give a concise, motivating, and actionable coaching message (3-4 sentences max). Include:
1. What went well
2. The main weakness to fix
3. One specific recommendation for the next test

Be direct, warm, and specific. No bullet points, just flowing text.`;

    const coachResponse = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: coachPrompt }],
      temperature: 0.6,
    });

    const aiCoachFeedback = coachResponse.choices[0].message.content ?? "Keep practicing consistently to improve your score!";

    // Save to database if user is logged in
    if (userId) {
      await ctx.runMutation(internal.stats.saveTestResult, {
        userId,
        score,
        maxScore,
        correct,
        incorrect,
        unattempted,
        subjects,
        difficulty,
        numQuestions: questions.length,
        timeTaken: totalTimeTaken,
        results,
        aiCoachFeedback,
      });
    }

    return {
      score,
      maxScore,
      correct,
      incorrect,
      unattempted,
      results,
      aiCoachFeedback,
      errorBreakdown,
    };
  },
});
