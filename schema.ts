import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  testHistory: defineTable({
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
  }).index("by_userId", ["userId"]),

  userStats: defineTable({
    userId: v.id("users"),
    totalTests: v.number(),
    totalScore: v.number(),
    totalMaxScore: v.number(),
    bestScore: v.number(),
    bestMaxScore: v.number(),
    subjectStats: v.record(
      v.string(),
      v.object({
        correct: v.number(),
        total: v.number(),
      })
    ),
  }).index("by_userId", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
