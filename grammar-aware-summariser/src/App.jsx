// src/App.jsx
import React, { useState, useMemo } from "react";
import {
  Routes,
  Route,
  BrowserRouter,
  useNavigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";

/* ============================
   CONFIG
============================ */
const BACKEND_URL = "http://localhost:8000/summarize";

/* ============================
   MODERN UI COMPONENTS
============================ */

function Header() {
  return (
    <header className="py-14 mb-10 backdrop-blur-xl bg-linear-to-b from-[#0b1c2c]/80 to-transparent border-b border-white/10">
      <div className="max-w-[1300px] mx-auto px-8 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-cyan-300 to-sky-500 drop-shadow-lg">
          Grammar-Aware Abstractive Summarizer
        </h1>
        <p className="mt-5 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto opacity-80">
          A modern AI summarizer crafted for academic & professional writing.
        </p>
      </div>
    </header>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl p-8 backdrop-blur-2xl bg-white/5 border border-white/10 shadow-xl ${className}`}
    >
      {children}
    </div>
  );
}

function ToggleButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl text-base font-semibold transition-all duration-200 ${
        active
          ? "bg-linear-to-r from-sky-500 to-cyan-400 text-white shadow-xl scale-[1.04]"
          : "bg-white/10 text-slate-300 hover:bg-white/20 backdrop-blur-md border border-white/10"
      }`}
    >
      {children}
    </button>
  );
}

/* ============================
   Home Page (Modern UI)
============================ */

const SUMMARY_OPTIONS = [
  { id: "concise", label: "Concise (Short)" },
  { id: "detailed", label: "Detailed (Medium)" },
  { id: "comprehensive", label: "Comprehensive (Long)" },
];

const STYLE_OPTIONS = [
  { id: "formal", label: "Formal Academic" },
  { id: "professional", label: "Professional Report" },
  { id: "executive", label: "Executive Summary" },
];

function buildTones(styleId) {
  switch (styleId) {
    case "formal":
      return { formal: 85, concise: 15 };
    case "professional":
      return { professional: 80, concise: 20 };
    case "executive":
      return { executive: 70, concise: 30 };
    default:
      return { formal: 70, concise: 30 };
  }
}

function summaryPercentFromLen(len) {
  return len === "concise" ? 12 : len === "detailed" ? 25 : 60;
}

function Home() {
  const navigate = useNavigate();
  const [summaryLen, setSummaryLen] = useState("detailed");
  const [style, setStyle] = useState("formal");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [previewSummary, setPreview] = useState("");
  const [previewCorrected, setPreviewCorrected] = useState("");
  const [previewMetadata, setPreviewMetadata] = useState({});

  const wordCount = useMemo(() => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }, [text]);

  async function handleGenerate() {
    setError(null);
    setPreview("");
    setPreviewCorrected("");
    setPreviewMetadata({});

    if (!text.trim()) {
      setError("Enter text to summarize.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        text,
        summary_length_percent: summaryPercentFromLen(summaryLen),
        tones: buildTones(style),
        do_grammar_correction: true,
        paraphrase_after: true,
      };

      const res = await axios.post(BACKEND_URL, payload);
      const data = res.data;

      setPreview(data.paraphrased_summary || data.summary || "");
      setPreviewCorrected(data.corrected_text || "");
      setPreviewMetadata(data.metadata || {});

      setTimeout(() => {
        document?.getElementById("preview-box")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 120);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function openFull() {
    navigate("/result", {
      state: {
        summary: previewSummary,
        corrected: previewCorrected,
        metadata: previewMetadata,
        style,
        summaryLen,
      },
    });
  }

  return (
    <div className="space-y-10">
      <Card>
        <h3 className="text-xl font-bold text-slate-200 mb-3">Summary Length</h3>
        <div className="flex flex-wrap gap-4">
          {SUMMARY_OPTIONS.map((o) => (
            <ToggleButton
              key={o.id}
              active={summaryLen === o.id}
              onClick={() => setSummaryLen(o.id)}
            >
              {o.label}
            </ToggleButton>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-xl font-bold text-slate-200 mb-3">Writing Style</h3>
        <div className="flex flex-wrap gap-4">
          {STYLE_OPTIONS.map((o) => (
            <ToggleButton
              key={o.id}
              active={style === o.id}
              onClick={() => setStyle(o.id)}
            >
              {o.label}
            </ToggleButton>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-xl font-bold text-slate-200 mb-4">Enter Text</h3>
        <textarea
          className="w-full min-h-[380px] rounded-3xl bg-slate-900/60 border border-white/10 p-6 text-lg text-sky-100 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/40"
          placeholder="Paste your academic content here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <p className="mt-3 text-right text-slate-400 text-sm">{wordCount} words</p>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-6 w-full py-4 rounded-2xl bg-linear-to-r from-sky-500 to-cyan-400 text-white text-lg font-semibold shadow-xl hover:brightness-110 active:scale-[0.98] transition-all"
        >
          {loading ? "Generating..." : "Generate Summary"}
        </button>

        {error && (
          <p className="mt-4 text-red-400 text-center text-lg">{error}</p>
        )}
      </Card>

      {/* PREVIEW */}
      <div id="preview-box">
        <Card className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-semibold text-sky-200">
              Generated Summary
            </h3>
            <span className="text-slate-400 text-base">Tone: {style}</span>
          </div>

          {!previewSummary && !loading && (
            <p className="italic text-slate-400">Generate to preview…</p>
          )}

          {loading && <p className="text-slate-300">Summarizing...</p>}

          {previewSummary && (
            <div>
              <p className="whitespace-pre-wrap text-lg text-sky-100 leading-relaxed">
                {previewSummary}
              </p>

              <div className="flex gap-4 mt-6">
                <button
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 border border-white/10"
                  onClick={() => navigator.clipboard.writeText(previewSummary)}
                >
                  Copy
                </button>

                <button
                  className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white"
                  onClick={openFull}
                >
                  View Full Result
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ============================
   RESULT PAGE (Modern UI)
============================ */

function Result() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const summary = state?.summary || "";
  const corrected = state?.corrected || "";
  const metadata = state?.metadata || {};
  const style = state?.style;
  const length = state?.summaryLen;

  return (
    <div className="space-y-10">
      <button
        onClick={() => navigate(-1)}
        className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10"
      >
        ← Back
      </button>

      <Card>
        <h2 className="text-3xl font-bold text-sky-200 mb-4">
          Generated Summary
        </h2>
        <p className="text-slate-400 mb-6">
          Style: {style} • Length: {length}
        </p>

        <p className="whitespace-pre-wrap text-lg text-sky-100 leading-relaxed">
          {summary}
        </p>
      </Card>

      <Card>
        <h3 className="text-xl font-semibold text-sky-200 mb-2">
          Corrected Text
        </h3>
        <p className="text-slate-300 whitespace-pre-wrap">{corrected}</p>
      </Card>

      <Card>
        <h3 className="text-xl font-semibold text-sky-200 mb-2">
          Metadata
        </h3>
        <pre className="text-slate-300 text-sm max-h-96 overflow-auto">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </Card>
    </div>
  );
}

/* ============================
   MAIN APP + ROUTER
============================ */

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-linear-to-br from-[#07121f] to-[#0a1a2d] text-white">
        <Header />
        <main className="max-w-[1300px] mx-auto px-8 pb-32">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/result" element={<Result />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
