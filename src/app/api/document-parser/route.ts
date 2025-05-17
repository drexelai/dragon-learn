import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { tmpdir } from "os";
import { writeFile } from "fs/promises";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { ChatOpenAI } from "@langchain/openai";
import { ModuleResponseSchema } from "@/lib/schemas";
import { tool } from "@langchain/core/tools";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported." },
        { status: 400 }
      );
    }

    // Save file temporarily
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop();
    const filePath = path.join(tmpdir(), `${Date.now()}.${ext}`);
    await writeFile(filePath, buffer);

    // Extract PDF content
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    const text = docs
      .map((d) => d.pageContent)
      .join("\n")
      .slice(0, 8000);

    console.log("Extracted text length:", text.length);

    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
    });

    const responseFormatterTool = tool(async () => {}, {
      name: "responseFormatter",
      description: "Extract structured learning content from course material.",
      schema: ModuleResponseSchema,
    });

    const modelWithTools = model.bindTools([responseFormatterTool]);

    // Invoke model
    const structured = await modelWithTools.invoke(
      `You are an AI course designer.

Given the following PDF content, extract and generate a 10-week course plan based strictly on what is taught in the document.

Each module should reflect an actual topic from the content. Include subtopics with detailed markdown notes and relevant quiz questions.

Here is the content to analyze:
"""
${text}
"""
`
    );

    const structuredArgs = structured?.tool_calls?.[0]?.args;

    console.log(
      "Structured args only:",
      JSON.stringify(structuredArgs, null, 2)
    );

    if (structuredArgs) {
      // Return raw JSON so frontend can parse it directly
      return new NextResponse(JSON.stringify(structuredArgs), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    return NextResponse.json(
      { error: "No structured content found in model response." },
      { status: 500 }
    );
  } catch (err) {
    console.error("Error in structured extraction:", err);
    return NextResponse.json(
      { error: "Failed to extract structured content." },
      { status: 500 }
    );
  }
}
