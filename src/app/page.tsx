"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF document only.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/document-parser", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.modules) {
        // Store in localStorage to access it on /course
        localStorage.setItem("curriculumData", JSON.stringify(data));
        router.push("/course"); // Redirect to course page
      } else {
        setError(data.error || "No structured content extracted.");
      }
    } catch (err) {
      setError("Something went wrong while uploading.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <section className="flex flex-col items-center gap-6 w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center">Learn Anything</h1>
        <p className="text-gray-600 text-center">
          Upload a syllabus or course document to generate a custom 10-week learning plan.
        </p>

        <button
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          onClick={handleButtonClick}
          disabled={loading}
        >
          {loading ? "Processing..." : "Upload PDF"}
        </button>

        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {error && (
          <div className="mt-4 text-red-600 text-sm bg-red-50 p-3 rounded w-full text-center">
            {error}
          </div>
        )}
      </section>
    </div>
  );
}
