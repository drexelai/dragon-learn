// app/page.tsx
"use client";

import { useRef, useState, useEffect } from "react";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [responseData, setResponseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Define user-facing steps
  const steps = [
    "Uploading document",
    "Extracting text",
    "Planning course structure",
    "Generating detailed content",
    "Creating quizzes",
    "Finalizing output"
  ];

  // Advance stepIndex every few seconds while loading
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined = undefined;
    if (loading) {
      setStepIndex(0);
      timer = setInterval(() => {
        setStepIndex((idx) => Math.min(idx + 1, steps.length - 1));
      }, 3000);
    } else if (timer) {
      clearInterval(timer);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading]);

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

    setLoading(true);
    setResponseData(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/document-parser", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResponseData(data);
      } else {
        setError(data.error || "Failed to generate course.");
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <section className="flex flex-col items-center gap-6 w-full max-w-lg">
        <h1 className="text-4xl font-bold">Generate Your Course</h1>
        <p className="text-gray-600 text-center">
          Upload a PDF and let AI design a 10-week curriculum with detailed notes and quizzes.
        </p>

        <button
          onClick={handleButtonClick}
          disabled={loading}
          className={`bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors font-medium ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
          }`}
        >
          {loading ? 'Processing...' : 'Upload PDF'}
        </button>

        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {loading && (
          <p className="text-blue-600 mt-4 font-medium flex items-center">
            {steps[stepIndex]}...
          </p>
        )}

        {error && (
          <p className="text-red-600 mt-4">{error}</p>
        )}

        {responseData && (
          <div className="mt-6 w-full">
            {/* Save to localStorage and navigate to course page */}
            <button
              onClick={() => {
                localStorage.setItem('curriculumData', JSON.stringify(responseData));
                window.location.href = '/course';
              }}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              View Generated Course
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
