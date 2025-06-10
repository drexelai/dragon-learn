"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import remarkGfm from "remark-gfm";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { ArrowLeft } from "lucide-react";

const slugify = (text: string) =>
  text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");

// Converts (\latex) => $latex$, [\latex] => $$latex$$
function normalizeMath(text: string) {
  return text
    .replace(/\(\s*\\(.*?)\s*\)/g, (_, expr) => `$${expr.trim()}$`)
    .replace(/\[\s*\\(.*?)\s*\]/g, (_, expr) => `$$${expr.trim()}$$`);
}

export default function ModulePage() {
  const [module, setModule] = useState<any>(null);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const stored = localStorage.getItem("curriculumData");
    if (!stored || !params?.slug) {
      router.push("/");
      return;
    }

    const data = JSON.parse(stored);
    const matchedModule = data.modules.find(
      (mod: any) => slugify(mod.module_title) === params.slug
    );

    if (!matchedModule) {
      router.push("/course");
    } else {
      setModule(matchedModule);
    }
  }, [params?.slug]);

  useEffect(() => {
    if (!module) return;

    const tocContainer = document.getElementById("toc-placeholder");
    if (tocContainer) {
      tocContainer.innerHTML = module.subtopics
        .map(
          (sub: any) =>
            `<a href="#${slugify(sub.title)}" class="block text-sm text-gray-700 hover:underline mb-2">${sub.title}</a>`
        )
        .join("");
    }
  }, [module]);


  if (!module) return <p className="p-6 text-gray-500">Loading module...</p>;

  return (
    <main className="px-8 py-10 max-w-6xl mx-auto lg:px-12">
      <div className="mb-8">
        <button
          onClick={() => router.push("/course")}
          className="flex items-center text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to course
        </button>
      </div>

      <header className="mb-10">
        <h1 className="text-4xl font-semibold text-gray-900 mb-2">
          {module.module_title}
        </h1>
        <p className="text-sm text-gray-500">
          Week {module.week_number} · {module.estimated_duration_minutes ?? "—"} min
        </p>
      </header>

      <div className="space-y-12">
        {module.subtopics.map((sub: any, i: number) => (
          <section key={i} className="space-y-6">
            <div>
              <h2
                id={slugify(sub.title)}
                className="text-2xl font-semibold text-gray-900 scroll-mt-28"
              >
                {sub.title}
              </h2>

              {sub.description && (
                <p className="text-gray-600 mt-1">{sub.description}</p>
              )}
            </div>

            {sub.detailed_notes_md && (
              <div className="prose prose-neutral max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code: ({ node, ...props }) => (
                      <code className="bg-gray-100 px-1 rounded text-sm font-mono text-blue-800">
                        {props.children}
                      </code>
                    ),
                    pre: ({ node, ...props }) => (
                      <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                        {props.children}
                      </pre>
                    ),
                  }}
                >
                  {normalizeMath(sub.detailed_notes_md)}
                </ReactMarkdown>

              </div>
            )}

            {sub.quiz_questions?.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Quiz Questions
                </h3>
                <Accordion
                  type="multiple"
                  className="border border-gray-200 rounded-md divide-y"
                >
                  {sub.quiz_questions.map((q: any, qIndex: number) => (
                    <AccordionItem key={qIndex} value={`q-${i}-${qIndex}`}>
                      <AccordionTrigger className="px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50">
                        Q{qIndex + 1}: {q.question}
                      </AccordionTrigger>
                      <AccordionContent className="bg-white px-5 py-3 text-sm text-gray-700 space-y-2">
                        <ul className="list-disc pl-5 space-y-1">
                          {q.options.map((opt: string, optIdx: number) => (
                            <li key={optIdx}>{opt}</li>
                          ))}
                        </ul>
                        <p className="text-green-700 font-semibold">
                          ✅ Answer: {q.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
