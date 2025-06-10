// utils/generateContent.ts
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import pLimit from "p-limit";
import {
  SubtopicSchema,
  QuizQuestionSchema,
} from "@/lib/schemas";

const model = new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0.3 });

// Helper to pause between LLM calls
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry helper: attempts fn up to `retries`, waiting `pause` ms between
async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  pause = 1000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`Attempt ${i + 1} failed:`, err);
      if (i < retries - 1) await delay(pause);
    }
  }
  throw lastError;
}

// Limit concurrent subtopic calls to avoid overwhelming rate limits
const subtopicLimit = pLimit(3);

// Schema for planning modules and subtopics
const PlanSchema = z.object({
  modules: z
    .array(
      z.object({
        module_title: z.string(),
        module_description: z.string().nullable().optional(),
        week_number: z.number().optional(),
        subtopics: z.array(
          z.object({
            title: z.string(),
            description: z.string().nullable().optional(),
          })
        ),
      })
    )
    .describe("A list of modules with subtopics"),
});

export type Plan = z.infer<typeof PlanSchema>;

/**
 * Generate an initial 10-week plan from raw text
 */
export async function generatePlanFromText(text: string): Promise<Plan> {
  const structured = model.withStructuredOutput(PlanSchema);
  const plan = await structured.invoke(
    `You are an expert course architect. Given the following course material, create a 10-week course plan. For each week 1–10, include:
- module_title: the week's topic
- module_description: a brief summary
- week_number: the week index
- subtopics: 3 to 5 topics with titles and short descriptions
Here is the material:
"""
${text}
"""`
  );
  return plan;
}

/**
 * Generate detailed markdown notes for a given subtopic
 */
export async function generateSubtopicContent(
  moduleTitle: string,
  subtopicTitle: string
): Promise<{ title: string; detailed_notes_md: string }> {
  const response = await model.call([
    { role: "system", content: "You are an expert course content writer. Provide detailed markdown notes only." },
    { role: "user", content: `Generate in-depth markdown notes for the subtopic "${subtopicTitle}" under the module "${moduleTitle}". Include examples, code snippets, or math as needed.` },
  ]);
  let detailed: string;
  if (typeof response.content === "string") {
    detailed = response.content;
  } else if (Array.isArray(response.content)) {
    detailed = response.content.map((c: any) => (typeof c === "string" ? c : c.text || "")).join("");
  } else {
    detailed = String(response.content);
  }
  return { title: subtopicTitle, detailed_notes_md: detailed };
}

/**
 * Generate 3-5 multiple-choice quiz questions based on subtopic content
 */
export async function generateQuiz(
  subtopicTitle: string,
  content: string
): Promise<{ quiz_questions: Array<z.infer<typeof QuizQuestionSchema>> }> {
  const schema = z.object({ quiz_questions: z.array(QuizQuestionSchema) });
  const structured = model.withStructuredOutput(schema);
  const quiz = await structured.invoke(
    `Generate 3-5 multiple choice quiz questions for the subtopic "${subtopicTitle}" based on the following content:\n"""
${content}
"""`
  );
  return quiz;
}

/**
 * Full orchestration: plan -> content -> quiz
 * Modules processed sequentially, subtopics concurrently with retry
 */
export async function generateFullCourseFromText(text: string) {
  const plan = await retry(() => generatePlanFromText(text), 5);

  const modules: any[] = [];
  for (const [modIdx, mod] of plan.modules.entries()) {
    console.log(`Processing module ${modIdx + 1}: "${mod.module_title}"`);

    const enrichedSubtopics = await Promise.all(
      mod.subtopics.map((st) =>
        subtopicLimit(async () => {
          console.log(`  Generating content for subtopic: "${st.title}"`);
          const content = await retry(
            () => generateSubtopicContent(mod.module_title, st.title),
            5
          );
          await delay(500);
          console.log(`  Generating quiz for subtopic: "${st.title}"`);
          const quiz = await retry(
            () => generateQuiz(st.title, content.detailed_notes_md),
            5
          );
          await delay(500);
          return {
            title: st.title,
            description: st.description,
            detailed_notes_md: content.detailed_notes_md,
            quiz_questions: quiz.quiz_questions,
          };
        })
      )
    );

    modules.push({
      module_title: mod.module_title,
      module_description: mod.module_description,
      week_number: mod.week_number,
      subtopics: enrichedSubtopics,
    });

    console.log(`Finished module "${mod.module_title}".`);
  }

  console.log("Full course generation complete.");
  return { modules };
}
