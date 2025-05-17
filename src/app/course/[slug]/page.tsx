"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

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

  if (!module) return <p className="p-6">Loading...</p>;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">{module.module_title}</h1>
      <p className="text-gray-500 mb-4">Week {module.week_number}</p>

      {module.subtopics.map((sub: any, i: number) => (
        <div key={i} className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-1">{sub.title}</h3>
          <p className="text-gray-600 mb-2">{sub.description}</p>

          {sub.detailed_notes_md && (
            <div className="prose prose-sm prose-blue max-w-none mb-4">
              <ReactMarkdown>{sub.detailed_notes_md}</ReactMarkdown>
            </div>
          )}

          {sub.quiz_questions?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Quiz Questions:</h4>
              {sub.quiz_questions.map((q: any, qIndex: number) => (
                <div key={qIndex} className="mb-4">
                  <p className="font-semibold text-gray-800">
                    Q{qIndex + 1}: {q.question}
                  </p>
                  <ul className="list-disc list-inside ml-4 text-sm text-gray-700 mt-1">
                    {q.options.map((opt: string, optIdx: number) => (
                      <li key={optIdx}>{opt}</li>
                    ))}
                  </ul>
                  <p className="mt-1 text-green-700 text-sm">
                    <strong>Answer:</strong> {q.answer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </main>
  );
}
