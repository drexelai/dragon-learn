// app/api/document-parser/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { tmpdir } from "os";
import { writeFile } from "fs/promises";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { generateFullCourseFromText } from "@/utils/generateContent";
import { ModuleResponseSchema } from "@/lib/schemas";

export const config = {
  api: { bodyParser: false },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDFs allowed." }, { status: 400 });
    }

    // Save to temp
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop();
    const tmpPath = path.join(tmpdir(), `${Date.now()}.${ext}`);
    await writeFile(tmpPath, buffer);

    // Extract text
    const loader = new PDFLoader(tmpPath);
    const docs = await loader.load();
    const text = docs.map((d) => d.pageContent).join("\n").slice(0, 10000);

    // Generate full 10‑week course (plan + content + quizzes)
    const fullCourse = await generateFullCourseFromText(text);

    // Validate & shape under your top‑level ModuleResponseSchema
    const validated = ModuleResponseSchema.parse({
      lesson_title: fullCourse.modules[0]?.module_title || "Course",
      lesson_description: null,
      target_audience: null,
      total_estimated_duration_minutes: null,
      course_duration_weeks: fullCourse.modules.length,
      modules: fullCourse.modules,
    });

    return NextResponse.json(validated);
  } catch (err: any) {
    console.error("Course generation error:", err);
    return NextResponse.json(
      { error: err.message || "Server error during course generation." },
      { status: 500 }
    );
  }
}
