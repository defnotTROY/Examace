"use client";

import { useState, KeyboardEvent } from "react";

const defaultConfig = {
  background_color: "#050816",
  surface_color: "#050816",
  text_color: "#e2e8f0",
  primary_color: "#6366f1",
  secondary_color: "#8b5cf6",
  font_family: "Inter",
  font_size: 16,
  app_title: "examAce",
  tagline: "AI Study Guide Generator",
  input_placeholder: "Paste your lecture notes or textbook content here...",
  generate_button_text: "Generate Study Guide",
  summary_heading: "Summary",
  concepts_heading: "Key Concepts & Definitions",
  questions_heading: "Practice Questions",
  detailed_summary_heading: "Detailed Summary",
};

export default function Page() {
  const [config] = useState(defaultConfig);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [summary, setSummary] = useState("");
  const [concepts, setConcepts] = useState<{ term: string; def: string }[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [detailedSummary, setDetailedSummary] = useState("");
  const [error, setError] = useState<string | null>(null);

  const baseFontStack =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const fontFamily = `${config.font_family}, ${baseFontStack}`;
  const baseSize = config.font_size;

  const {
    background_color: bgColor,
    surface_color: surfaceColor,
    text_color: textColor,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
  } = config;

  const handleGenerate = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isGenerating) return;

    setIsGenerating(true);
    setShowResults(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputText: trimmed }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to generate:", text);
        setError("Something went wrong generating your study guide.");
        setIsGenerating(false);
        return;
      }

      const data = (await res.json()) as {
        summary: string;
        detailed_summary?: string;
        concepts: { term: string; def: string }[];
        questions: string[];
      };

      setSummary(data.summary || "");
      setConcepts(data.concepts || []);
      setQuestions(data.questions || []);
      setDetailedSummary(data.detailed_summary || "");
    } catch (err) {
      console.error(err);
      setError("Network error while talking to the AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  };

  // --------- EXPORT / COPY HELPERS ----------

  const hasExportableContent =
    !!summary || concepts.length > 0 || questions.length > 0 || !!detailedSummary;

  const buildExportText = () => {
    const parts: string[] = [];

    parts.push(`=== ${config.summary_heading} ===`);
    parts.push(summary || "No summary generated.");

    parts.push("");
    parts.push(`=== ${config.concepts_heading} ===`);
    if (concepts.length === 0) {
      parts.push("No key concepts generated.");
    } else {
      concepts.forEach((c, i) => {
        parts.push(`${i + 1}. ${c.term}`);
        parts.push(`   - ${c.def}`);
      });
    }

    parts.push("");
    parts.push(`=== ${config.questions_heading} ===`);
    if (questions.length === 0) {
      parts.push("No questions generated.");
    } else {
      questions.forEach((q, i) => {
        parts.push(`${i + 1}. ${q}`);
      });
    }

    parts.push("");
    parts.push(`=== ${config.detailed_summary_heading} ===`);
    parts.push(detailedSummary || "No detailed summary generated.");

    return parts.join("\n");
  };

  const handleCopyToClipboard = async () => {
    if (!hasExportableContent) {
      alert("Nothing to copy yet. Generate a study guide first.");
      return;
    }

    try {
      const text = buildExportText();
      await navigator.clipboard.writeText(text);
      alert("Study guide copied to clipboard ✅");
    } catch (err) {
      console.error(err);
      alert("Could not copy to clipboard.");
    }
  };

  const handleExportTxt = () => {
    if (!hasExportableContent) {
      alert("Nothing to export yet. Generate a study guide first.");
      return;
    }

    const text = buildExportText();
    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "study-guide.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (!hasExportableContent) {
      alert("Nothing to export yet. Generate a study guide first.");
      return;
    }

    const text = buildExportText();

    // Simple printable window; user can “Save as PDF” in the browser dialog
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocked. Please allow popups to export as PDF.");
      return;
    }

    const html = `
      <html>
        <head>
          <title>Study Guide</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              padding: 24px;
              line-height: 1.5;
              white-space: pre-wrap;
            }
            h1 {
              font-size: 20px;
              margin-bottom: 16px;
            }
          </style>
        </head>
        <body>
          <h1>${config.app_title} – Study Guide</h1>
          <pre>${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // ------------------------------------------

  return (
    <div
      className="min-h-screen antialiased"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontFamily,
        fontSize: baseSize,
      }}
    >
      {/* Global decor + animations */}
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .bg-orbit {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(
              circle at top left,
              rgba(99, 102, 241, 0.22),
              transparent 55%
            ),
            radial-gradient(
              circle at top right,
              rgba(139, 92, 246, 0.18),
              transparent 55%
            ),
            radial-gradient(
              circle at bottom,
              rgba(15, 23, 42, 0.95),
              rgba(15, 23, 42, 1)
            );
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in {
          animation: fadeIn 0.35s ease-out;
        }

        .loading-dots::after {
          content: "";
          animation: dots 1.5s steps(4, end) infinite;
        }

        @keyframes dots {
          0%,
          20% {
            content: "";
          }
          40% {
            content: ".";
          }
          60% {
            content: "..";
          }
          80%,
          100% {
            content: "...";
          }
        }

        .glass-surface {
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          background:
            radial-gradient(
              circle at top left,
              rgba(148, 163, 184, 0.24),
              transparent 55%
            ),
            rgba(15, 23, 42, 0.88);
        }

        .glass-panel {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          background: rgba(15, 23, 42, 0.94);
        }
      `}</style>

      {/* Background layer */}
      <div className="bg-orbit" />

      {/* Layout shell */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* HEADER */}
        <header className="border-b border-slate-800/60 bg-slate-950/60 shadow-sm backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-400/60"
                style={{
                  background: `conic-gradient(from 210deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`,
                }}
              >
                <span className="text-xl font-black text-white">A</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold tracking-tight text-slate-50 sm:text-lg">
                    {config.app_title}
                  </h1>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    style={{
                      backgroundColor: `${primaryColor}26`,
                      color: "#e5e7eb",
                    }}
                  >
                    Beta
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 sm:text-xs">
                  {config.tagline}
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-3 text-[11px] text-slate-400 sm:flex">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-900/60 px-2.5 py-1">
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-200">
                  ⌘
                </kbd>
                <span className="text-[10px] text-slate-500">+</span>
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-200">
                  Enter
                </kbd>
                <span className="ml-1 text-[10px] text-slate-500">
                  Quick generate
                </span>
              </span>

            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
          {/* Top message / hint */}
          <section className="glass-surface relative flex flex-col items-start justify-between gap-3 overflow-hidden rounded-2xl border border-slate-700/70 px-4 py-3 text-xs text-slate-100 shadow-lg shadow-slate-900/40 sm:flex-row sm:items-center sm:px-5 sm:text-sm">
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.35),transparent_55%)]" />
            </div>
            <div className="relative flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-sm">
                💡
              </span>
              <p className="leading-snug text-slate-100">
                Paste lecture notes, textbook pages, or slides — we&apos;ll turn
                them into a focused study guide.
              </p>
            </div>
            <p className="relative mt-1 text-[11px] text-slate-300 sm:mt-0">
              Pro tip: mention your{" "}
              <span className="font-semibold text-indigo-200">
                exam date & topics
              </span>{" "}
              for sharper questions.
            </p>
          </section>

          {/* Main grid */}
          <section className="grid min-h-[540px] grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)]">
            {/* LEFT: INPUT */}
            <div className="glass-panel flex flex-col rounded-2xl border border-slate-800/80 p-4 shadow-xl shadow-slate-950/50 sm:p-5 lg:p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-slate-50 sm:text-base">
                    Your content
                  </h2>
                  <p className="text-[11px] text-slate-400 sm:text-xs">
                    Paste your study material and we&apos;ll build a guide
                    around it.
                  </p>
                </div>
                <span className="hidden rounded-full border border-slate-700/80 bg-slate-900/70 px-2 py-1 text-[10px] text-slate-400 sm:inline-flex">
                  Auto-formats long notes
                </span>
              </div>

              <div className="mb-3 flex flex-wrap gap-2 text-[11px] text-slate-300 sm:text-xs">
                <span className="rounded-full bg-slate-900/80 px-2 py-1 ring-1 ring-slate-700/80">
                  ✅ Lecture notes
                </span>
                <span className="rounded-full bg-slate-900/80 px-2 py-1 ring-1 ring-slate-700/80">
                  ✅ Textbook paragraphs
                </span>
                <span className="rounded-full bg-slate-900/80 px-2 py-1 ring-1 ring-slate-700/80">
                  ✅ Slide exports
                </span>
              </div>

              <div className="relative flex-1">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={config.input_placeholder}
                  className="h-64 w-full flex-1 resize-none rounded-xl border border-slate-700/80 bg-slate-950/80 px-3.5 py-3 text-sm leading-relaxed text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 sm:h-[260px] sm:text-[13px] lg:h-full"
                  style={{
                    color: textColor,
                    fontFamily,
                    fontSize: baseSize * 0.9,
                  }}
                />
                <div className="pointer-events-none absolute bottom-2 left-3 text-[10px] text-slate-500">
                  {Math.max(0, 1000 - inputText.length)} chars until “too much
                  coffee”
                </div>
                <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-slate-500">
                  {inputText.length} chars
                </div>
              </div>

              {error && (
                <p className="mt-2 text-xs text-rose-400 sm:text-sm">{error}</p>
              )}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-slate-500 sm:text-xs">
                  Press{" "}
                  <kbd className="rounded bg-slate-900 px-1 py-0.5 text-[10px] text-slate-200">
                    ⌘
                  </kbd>
                  +
                  <kbd className="ml-0.5 rounded bg-slate-900 px-1 py-0.5 text-[10px] text-slate-200">
                    Enter
                  </kbd>{" "}
                  (or Ctrl + Enter) to generate instantly.
                </p>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !inputText.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/80 bg-linear-to-r from-indigo-500 via-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40   duration-150  enabled:hover:shadow-indigo-500/60 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                      <span className="loading-dots text-[13px]">
                        Generating
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[15px]">✨</span>
                      <span>{config.generate_button_text}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT: RESULTS / EMPTY */}
            {showResults ? (
              <div className="flex flex-col gap-4 lg:gap-5">
                {/* Export / Copy toolbar */}
                <div className="glass-panel flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-slate-800/80 px-3 py-2 text-[11px] text-slate-200 sm:text-xs">
                  <span className="mr-auto text-[11px] text-slate-400">
                    Export or reuse your study guide:
                  </span>
                  <button
                    onClick={handleCopyToClipboard}
                    className="rounded-lg border border-slate-700 bg-slate-900/80 px-2.5 py-1 hover:border-indigo-400 hover:bg-slate-900"
                  >
                    📋 Copy to clipboard
                  </button>
                  <button
                    onClick={handleExportTxt}
                    className="rounded-lg border border-slate-700 bg-slate-900/80 px-2.5 py-1 hover:border-indigo-400 hover:bg-slate-900"
                  >
                    📄 Export .txt
                  </button>
                  <button
                    onClick={handleExportPdf}
                    className="rounded-lg border border-slate-700 bg-slate-900/80 px-2.5 py-1 hover:border-indigo-400 hover:bg-slate-900"
                  >
                    🧾 Export PDF
                  </button>
                </div>

                {/* Summary */}
                <article className="fade-in glass-panel rounded-2xl border border-slate-800/80 p-4 shadow-xl shadow-slate-950/50 sm:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      📌
                    </div>
                    <h3 className="text-sm font-medium text-slate-50 sm:text-base">
                      {config.summary_heading}
                    </h3>
                    <span className="ml-auto text-[11px] uppercase tracking-wide text-slate-500">
                      Overview
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-200 sm:text-sm">
                    {summary || "No summary yet. Try generating again."}
                  </p>
                </article>

                {/* Concepts */}
                <article className="fade-in glass-panel rounded-2xl border border-slate-800/80 p-4 shadow-xl shadow-slate-950/50 sm:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs text-white"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      📚
                    </div>
                    <h3 className="text-sm font-medium text-slate-50 sm:text-base">
                      {config.concepts_heading}
                    </h3>
                    <span className="ml-auto text-[11px] uppercase tracking-wide text-slate-500">
                      Definitions
                    </span>
                  </div>
                  {concepts.length === 0 ? (
                    <p className="text-xs text-slate-300 sm:text-sm">
                      No key concepts found yet. Try a longer or more detailed
                      input.
                    </p>
                  ) : (
                    <div className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
                      {concepts.map((item, idx) => (
                        <div
                          key={idx}
                          className="group rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-2.5 transition hover:border-indigo-400/80 hover:bg-slate-900"
                          style={{
                            borderLeftWidth: 3,
                            borderLeftColor:
                              config.primary_color ||
                              defaultConfig.primary_color,
                          }}
                        >
                          <div className="mb-0.5 text-xs font-semibold text-slate-50 sm:text-sm">
                            {item.term}
                          </div>
                          <div className="text-[11px] text-slate-300 sm:text-xs">
                            {item.def}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                {/* Questions */}
                <article className="fade-in glass-panel rounded-2xl border border-slate-800/80 p-4 shadow-xl shadow-slate-950/50 sm:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      ❓
                    </div>
                    <h3 className="text-sm font-medium text-slate-50 sm:text-base">
                      {config.questions_heading}
                    </h3>
                    <span className="ml-auto text-[11px] uppercase tracking-wide text-slate-500">
                      Active recall
                    </span>
                  </div>
                  {questions.length === 0 ? (
                    <p className="text-xs text-slate-300 sm:text-sm">
                      No questions generated yet. Try adding more context or
                      examples to your notes.
                    </p>
                  ) : (
                    <ol className="flex max-h-64 list-decimal flex-col gap-2.5 overflow-y-auto pl-5 pr-1">
                      {questions.map((q, idx) => (
                        <li
                          key={idx}
                          className="text-xs leading-relaxed text-slate-200 sm:text-sm"
                        >
                          {q}
                        </li>
                      ))}
                    </ol>
                  )}
                </article>

                {/* Detailed Summary */}
                <article className="fade-in glass-panel rounded-2xl border border-slate-800/80 p-4 shadow-xl shadow-slate-950/50 sm:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs text-white"
                      style={{ backgroundColor: surfaceColor }}
                    >
                      📝
                    </div>
                    <h3 className="text-sm font-medium text-slate-50 sm:text-base">
                      {config.detailed_summary_heading}
                    </h3>
                    <span className="ml-auto text-[11px] uppercase tracking-wide text-slate-500">
                      In-depth review
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto pr-1">
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-200 sm:text-sm">
                      {detailedSummary ||
                        "No detailed summary yet. Try generating again or provide more context in your notes."}
                    </p>
                  </div>
                </article>
              </div>
            ) : (
              // EMPTY STATE
              <div className="glass-panel flex items-center justify-center rounded-2xl border border-slate-800/80 p-6 text-center shadow-xl shadow-slate-950/50 sm:p-8 lg:p-10">
                <div className="max-w-sm space-y-3">
                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-slate-700/80 bg-slate-950/80 shadow-xl shadow-indigo-500/30">
                    <div
                      className="absolute inset-1 rounded-full opacity-40"
                      style={{
                        background: `conic-gradient(from 230deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`,
                      }}
                    />
                    <span className="relative text-4xl">📚</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-50 sm:text-lg">
                    Your study guide will appear here
                  </h3>
                  <p className="text-xs text-slate-300 sm:text-sm">
                    Paste some content on the left and click{" "}
                    <span className="font-semibold text-indigo-300">
                      {config.generate_button_text}
                    </span>{" "}
                    to generate a tailored summary, key concepts, practice
                    questions, and a detailed explanation.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Start with one chapter or topic — shorter inputs often yield
                    sharper guides (and happier brains).
                  </p>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
