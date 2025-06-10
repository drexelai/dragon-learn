import { z } from "zod";

export const QuizQuestionSchema = z.object({
  question: z.string().describe("A quiz question related to the subtopic"),
  options: z.array(z.string()).describe("Multiple choice options"),
  answer: z.string().describe("The correct answer to the question"),
});

export const SubtopicSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  learning_objectives: z.array(z.string()).nullable().optional(),
  estimated_duration_minutes: z.number().nullable().optional(),
  resources: z.array(z.string()).nullable().optional(),
  detailed_notes_md: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Detailed notes in markdown format explaining the subtopic with examples, explanations, and code snippets where applicable"
    ),
  quiz_questions: z.array(QuizQuestionSchema).nullable().optional(),
});

export const ModuleStructureSchema = z.object({
  module_title: z.string(),
  module_description: z.string().nullable().optional(),
  week_number: z.number().nullable().optional().describe("The week this module is assigned to in a 10-week course"),
  prerequisites: z.array(z.string()).nullable().optional(),
  learning_objectives: z.array(z.string()).nullable().optional(),
  estimated_duration_minutes: z.number().nullable().optional(),
  subtopics: z.array(SubtopicSchema),
});

export const ModuleResponseSchema = z.object({
  lesson_title: z.string(),
  lesson_description: z.string().nullable().optional(),
  target_audience: z.string().nullable().optional(),
  total_estimated_duration_minutes: z.number().nullable().optional(),
  course_duration_weeks: z.number().optional().default(10),
  modules: z.array(ModuleStructureSchema),
});
