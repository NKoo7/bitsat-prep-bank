import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const saveTestResult = internalMutation({
  args: {
    userId: v.id("users"),
    score: v.number(),
    maxScore: v.number(),
    correct: v.number(),
    incorrect: v.number(),
    unattempted: v.number(),
    subjects: v.array(v.string()),
    difficulty: v.string(),
    numQuestions: v.number(),
    timeTaken: v.number(),
    results: v.array(
      v.object({
        subject: v.string(),
        question: v.string(),
        options: v.array(v.string()),
        correct_answer: v.string(),
        solution: v.string(),
        quick_trick: v.string(),
        concept: v.string(),
        userAnswer: v.union(v.string(), v.null()),
        status: v.union(
          v.literal("correct"),
          v.literal("incorrect"),
          v.literal("unattempted")
        ),
        timeTaken: v.number(),
        errorType: v.optional(
          v.union(
            v.literal("conceptual"),
            v.literal("calculation"),
            v.literal("time_pressure"),
            v.literal("none")
          )
        ),
      })
    ),
    aiCoachFeedback: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("testHistory", {
      userId: args.userId,
      score: args.score,
      maxScore: args.maxScore,
      correct: args.correct,
      incorrect: args.incorrect,
      unattempted: args.unattempted,
      subjects: args.subjects,
      difficulty: args.difficulty,
      numQuestions: args.numQuestions,
      timeTaken: args.timeTaken,
      results: args.results,
      aiCoachFeedback: args.aiCoachFeedback,
    });

    // Update user stats
    const existing = await ctx.db
      .query("userStats")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    const subjectStats: Record<string, { correct: number; total: number }> =
      existing?.subjectStats ?? {};

    for (const r of args.results) {
      if (!subjectStats[r.subject]) {
        subjectStats[r.subject] = { correct: 0, total: 0 };
      }
      subjectStats[r.subject].total += 1;
      if (r.status === "correct") {
        subjectStats[r.subject].correct += 1;
      }
    }

    const scorePct = args.score / args.maxScore;
    const bestScorePct = existing
      ? existing.bestScore / existing.bestMaxScore
      : -Infinity;

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalTests: existing.totalTests + 1,
        totalScore: existing.totalScore + args.score,
        totalMaxScore: existing.totalMaxScore + args.maxScore,
        bestScore: scorePct > bestScorePct ? args.score : existing.bestScore,
        bestMaxScore: scorePct > bestScorePct ? args.maxScore : existing.bestMaxScore,
        subjectStats,
      });
    } else {
      await ctx.db.insert("userStats", {
        userId: args.userId,
        totalTests: 1,
        totalScore: args.score,
        totalMaxScore: args.maxScore,
        bestScore: args.score,
        bestMaxScore: args.maxScore,
        subjectStats,
      });
    }
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const stats = await ctx.db
      .query("userStats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    return stats;
  },
});

export const getTestHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const history = await ctx.db
      .query("testHistory")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);

    return history;
  },
});
