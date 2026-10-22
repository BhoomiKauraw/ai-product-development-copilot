import { useCallback, useEffect, useState } from "react";
import "./App.css";

type PRD = {
  id?: number;
  title: string;
  problem_statement: string;
  target_users: string[];
  goals: string[];
  features: string[];
  user_stories: string[];
  assumptions: string[];
};

type SavedPRD = {
  id: number;
  idea: string;
  prd: PRD;
  created_at: string;
};
type RiceFeature = {
  name: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
};

type RiceResult = RiceFeature & {
  score: number;
  rank: number;
};

const API_URL = "http://127.0.0.1:8000";

export default function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [idea, setIdea] = useState("");
  const [prd, setPrd] = useState<PRD | null>(null);
  const [history, setHistory] = useState<SavedPRD[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [features, setFeatures] = useState<RiceFeature[]>([
  {
    name: "Skill-based teammate matching",
    reach: 200,
    impact: 3,
    confidence: 80,
    effort: 2,
  },
  {
    name: "Availability matching",
    reach: 150,
    impact: 2,
    confidence: 70,
    effort: 1.5,
  },
]);

const [riceResults, setRiceResults] = useState<RiceResult[]>([]);
const [riceLoading, setRiceLoading] = useState(false);
const [riceError, setRiceError] = useState("");

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/prds`);

      if (!response.ok) {
        throw new Error("Could not load saved PRDs.");
      }

      const data: SavedPRD[] = await response.json();
      setHistory(data);
    } catch {
      setError("Could not load PRD history. Check that the backend is running.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    async function checkBackend() {
      try {
        const response = await fetch(`${API_URL}/health`);

        if (!response.ok) {
          throw new Error("Backend health check failed");
        }

        const data: { status: string; message: string } =
          await response.json();

        setBackendStatus(data.message);
      } catch {
        setBackendStatus("Cannot connect. Is the backend running?");
      }
    }

    checkBackend();
    loadHistory();
  }, [loadHistory]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!idea.trim()) {
      setError("Please enter a product idea.");
      return;
    }

    setLoading(true);
    setError("");
    setPrd(null);

    try {
      const response = await fetch(`${API_URL}/api/prd`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idea: idea.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "PRD generation failed."
        );
      }

      setPrd(data as PRD);
      await loadHistory();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  function openSavedPRD(saved: SavedPRD) {
    setIdea(saved.idea);
    setPrd(saved.prd);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
function updateFeature(
  index: number,
  field: keyof RiceFeature,
  value: string
) {
  setFeatures((current) =>
    current.map((feature, i) => {
      if (i !== index) return feature;

      if (field === "name") {
        return { ...feature, name: value };
      }

      return {
        ...feature,
        [field]: value === "" ? 0 : Number(value),
      };
    })
  );
}

function addFeature() {
  if (features.length >= 50) {
    setRiceError("You can prioritize up to 50 features at a time.");
    return;
  }

  setFeatures((current) => [
    ...current,
    {
      name: "",
      reach: 100,
      impact: 1,
      confidence: 80,
      effort: 1,
    },
  ]);

  setRiceError("");
}

function removeFeature(index: number) {
  setFeatures((current) => current.filter((_, i) => i !== index));
  setRiceResults([]);
  setRiceError("");
}

async function calculatePriorities() {
  setRiceError("");
  setRiceResults([]);

  if (features.length === 0) {
    setRiceError("Add at least one feature.");
    return;
  }

  if (
    features.some(
      (feature) =>
        !feature.name.trim() ||
        !Number.isFinite(feature.reach) ||
        !Number.isInteger(feature.reach) ||
        feature.reach < 0 ||
        feature.reach > 1_000_000 ||
        !Number.isFinite(feature.impact) ||
        feature.impact <= 0 ||
        feature.impact > 3 ||
        !Number.isFinite(feature.confidence) ||
        feature.confidence <= 0 ||
        feature.confidence > 100 ||
        !Number.isFinite(feature.effort) ||
        feature.effort <= 0 ||
        feature.effort > 10_000
    )
  ) {
    setRiceError(
      "Check your inputs: reach must be a whole number from 0 to 1,000,000; impact must be above 0 and at most 3; confidence must be above 0 and at most 100; effort must be above 0 and at most 10,000."
    );
    return;
  }

  setRiceLoading(true);

  try {
    const response = await fetch(`${API_URL}/api/rice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ features }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data.detail === "string"
          ? data.detail
          : "Could not calculate RICE scores."
      );
    }

    setRiceResults(data.results as RiceResult[]);
  } catch (err) {
    setRiceError(
      err instanceof Error
        ? err.message
        : "Something went wrong while calculating scores."
    );
  } finally {
    setRiceLoading(false);
  }
}
function downloadPRD() {
  if (!prd) return;

  const markdown = [
    `# ${prd.title}`,
    "",
    "## Problem Statement",
    "",
    prd.problem_statement,
    "",
    "## Target Users",
    "",
    ...prd.target_users.map((user) => `- ${user}`),
    "",
    "## Goals",
    "",
    ...prd.goals.map((goal) => `- ${goal}`),
    "",
    "## Features",
    "",
    ...prd.features.map((feature) => `- ${feature}`),
    "",
    "## User Stories",
    "",
    ...prd.user_stories.map((story) => `- ${story}`),
    "",
    "## Assumptions",
    "",
    ...prd.assumptions.map((assumption) => `- ${assumption}`),
    "",
  ].join("\n");

  const blob = new Blob([markdown], {
    type: "text/markdown;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "product-requirements-document.md";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
  return (
    <main className="container">
      <header>
        <p className="eyebrow">YOUR AI PRODUCT WORKSPACE</p>
        <h1>AI Product Development Copilot</h1>
        <p className="subtitle">
          Turn your product idea into a structured plan.
        </p>
      </header>

      <section className="status">
        <span className="status-dot" />
        Backend: {backendStatus}
      </section>

      <form className="idea-form" onSubmit={handleSubmit}>
        <label htmlFor="idea">Describe your product idea</label>

        <textarea
          id="idea"
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          placeholder="Example: An app that helps college students find hackathon teammates..."
          rows={6}
          maxLength={3000}
        />

        <p className="hint">
          Explain the problem, who faces it, and what you want to build.
        </p>

        <button type="submit" disabled={loading}>
          {loading ? "Generating your PRD..." : "Generate PRD"}
        </button>

        {error && <p className="error-message">{error}</p>}
      </form>
      <section className="rice-section">
  <p className="eyebrow">PRODUCT MANAGEMENT TOOL</p>
  <h2>Feature Prioritization</h2>
  <p className="subtitle">
    Compare features using Reach, Impact, Confidence, and Effort.
  </p>

  <p className="hint">
    Reach = users affected in a fixed period. Impact = 0–3.
    Confidence = percentage. Effort = person-months.
    Use the same period and units for every feature.
  </p>

  <div className="rice-feature-list">
    {features.map((feature, index) => (
      <div className="rice-feature" key={index}>
        <div className="rice-feature-heading">
          <h3>Feature {index + 1}</h3>
          <button
            type="button"
            className="remove-button"
            onClick={() => removeFeature(index)}
          >
            Remove
          </button>
        </div>

        <label htmlFor={`feature-name-${index}`}>Feature name</label>
        <input
          id={`feature-name-${index}`}
          value={feature.name}
          maxLength={150}
          onChange={(event) =>
            updateFeature(index, "name", event.target.value)
          }
          placeholder="e.g. Skill matching"
        />

        <div className="rice-input-grid">
          <div>
            <label htmlFor={`reach-${index}`}>Reach</label>
            <input
              id={`reach-${index}`}
              type="number"
              min="0"
              max="1000000"
              step="1"
              value={feature.reach}
              onChange={(event) =>
                updateFeature(index, "reach", event.target.value)
              }
            />
          </div>

          <div>
            <label htmlFor={`impact-${index}`}>Impact (0–3)</label>
            <input
              id={`impact-${index}`}
              type="number"
              min="0.01"
              max="3"
              step="0.1"
              value={feature.impact}
              onChange={(event) =>
                updateFeature(index, "impact", event.target.value)
              }
            />
          </div>

          <div>
            <label htmlFor={`confidence-${index}`}>
              Confidence (%)
            </label>
            <input
              id={`confidence-${index}`}
              type="number"
              min="0.01"
              max="100"
              step="1"
              value={feature.confidence}
              onChange={(event) =>
                updateFeature(index, "confidence", event.target.value)
              }
            />
          </div>

          <div>
            <label htmlFor={`effort-${index}`}>
              Effort (person-months)
            </label>
            <input
              id={`effort-${index}`}
              type="number"
              min="0.01"
              max="10000"
              step="0.1"
              value={feature.effort}
              onChange={(event) =>
                updateFeature(index, "effort", event.target.value)
              }
            />
          </div>
        </div>
      </div>
    ))}
  </div>

  <button
    type="button"
    className="secondary-button"
    onClick={addFeature}
    disabled={features.length >= 50}
  >
    + Add feature
  </button>

  <button
    type="button"
    onClick={calculatePriorities}
    disabled={riceLoading}
  >
    {riceLoading ? "Calculating..." : "Calculate RICE scores"}
  </button>

  {riceError && (
    <p className="error-message" role="alert">
      {riceError}
    </p>
  )}

  {riceResults.length > 0 && (
    <div className="rice-results">
      <h3>Prioritized features</h3>
      <p className="hint">
        Higher scores rank first. Scores are estimates, not guarantees.
      </p>

      {riceResults.map((result) => (
        <div className="rice-result" key={result.name}>
          <div className="rice-result-heading">
            <strong>
              #{result.rank} — {result.name}
            </strong>
            <strong>{result.score.toLocaleString()}</strong>
          </div>

          <p className="hint">
            Reach: {result.reach} · Impact: {result.impact} ·
            Confidence: {result.confidence}% · Effort: {result.effort}
          </p>
        </div>
      ))}
    </div>
  )}
</section>

      {prd && (
        <section className="prd-card">
          <p className="eyebrow">GENERATED PRODUCT PLAN</p>
          <h2>{prd.title}</h2>
          <button
  type="button"
  onClick={downloadPRD}
  disabled={!prd}
>
  Download PRD (.md)
</button>

          <h3>Problem statement</h3>
          <p>{prd.problem_statement}</p>

          <h3>Target users</h3>
          <ul>
            {prd.target_users.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3>Goals</h3>
          <ul>
            {prd.goals.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3>MVP features</h3>
          <ul>
            {prd.features.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3>User stories</h3>
          <ul>
            {prd.user_stories.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3>Assumptions</h3>
          <ul>
            {prd.assumptions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="history-section">
        <div className="history-heading">
          <h2>PRD History</h2>
          <button
            type="button"
            className="refresh-button"
            onClick={() => {
              setError("");
              void loadHistory();
            }}
            disabled={historyLoading}
          >
            {historyLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {history.length === 0 && !historyLoading ? (
          <p className="hint">
            No saved PRDs yet. Generate your first product plan!
          </p>
        ) : (
          <div className="history-list">
            {history.map((saved) => (
              <button
                type="button"
                className="history-item"
                key={saved.id}
                onClick={() => openSavedPRD(saved)}
              >
                <strong>
                  #{saved.id} — {saved.prd.title}
                </strong>
                <span>{saved.idea}</span>
                <small>
                  Saved: {new Date(`${saved.created_at}Z`).toLocaleString()}
                </small>
              </button>
            ))}
          </div>
        )}
      </section>

      <footer>
        Built with React, TypeScript, FastAPI, Gemini, and SQLite.
      </footer>
    </main>
  );
}