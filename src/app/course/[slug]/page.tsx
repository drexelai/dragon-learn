"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft } from "lucide-react";

const slugify = (text: string) =>
  text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");

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

  if (!module) return <p className="p-6 text-gray-500">Loading module...</p>;

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-10">
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to course
      </button>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">
          {module.module_title}
        </h1>
        <p className="text-gray-500 text-sm">
          Week {module.week_number} · {module.estimated_duration_minutes ?? "—"} min
        </p>
      </header>

      {module.subtopics.map((sub: any, i: number) => (
        <section
          key={i}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6"
        >
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {sub.title}
            </h2>
            {sub.description && (
              <p className="text-gray-600 mt-1">{sub.description}</p>
            )}
          </div>

          {sub.detailed_notes_md && (
            <div className="prose max-w-none prose-blue prose-p:leading-relaxed prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown>{sub.detailed_notes_md}</ReactMarkdown>
            </div>
          )}

          {sub.quiz_questions?.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Quiz Questions
              </h3>
              <Accordion type="multiple" className="w-full">
                {sub.quiz_questions.map((q: any, qIndex: number) => (
                  <AccordionItem key={qIndex} value={`q-${i}-${qIndex}`}>
                    <AccordionTrigger>
                      Q{qIndex + 1}: {q.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-gray-700 space-y-2">
                      <ul className="list-disc list-inside ml-4">
                        {q.options.map((opt: string, optIdx: number) => (
                          <li key={optIdx}>{opt}</li>
                        ))}
                      </ul>
                      <p className="text-green-600">
                        ✅ <strong>Answer:</strong> {q.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
