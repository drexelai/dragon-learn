"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const slugify = (text: string) =>
  text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");

export default function CoursePage() {
  const [data, setData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("curriculumData");
    if (!stored) {
      router.push("/");
    } else {
      setData(JSON.parse(stored));
    }
  }, []);

  if (!data) return null;

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{data.lesson_title}</h1>
      <p className="text-gray-700 mb-6">{data.lesson_description}</p>

      <div className="space-y-4">
        {data.modules.map((mod: any, i: number) => (
          <Link
            key={i}
            href={`/course/${slugify(mod.module_title)}`}
            className="block p-4 border rounded-lg hover:shadow transition"
          >
            <h2 className="text-xl font-semibold">{mod.module_title}</h2>
            <p className="text-gray-600 text-sm">Week {mod.week_number}</p>
            <ul className="mt-2 list-disc list-inside text-gray-700">
              {mod.learning_objectives?.map((obj: string, j: number) => (
                <li key={j}>{obj}</li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </main>
  );
}
