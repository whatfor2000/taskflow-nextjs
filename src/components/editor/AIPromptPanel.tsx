"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import type { GeneratedFlow } from "@/lib/types";

const EXAMPLES = [
  "Plan a product launch for a mobile app",
  "Onboard a new engineering hire in their first week",
  "Create a content publishing workflow with review",
  "Migrate a legacy service with risk checks",
];

export default function AIPromptPanel({
  onApply,
  onClose,
}: {
  onApply: (flow: GeneratedFlow, mode: "replace" | "merge") => void;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedFlow | null>(null);
  const [raw, setRaw] = useState<string | null>(null);

  async function generate() {
    const p = prompt.trim();
    if (!p) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to generate flow");
        setRaw(typeof data?.raw === "string" ? data.raw : null);
        return;
      }
      setResult(data.flow as GeneratedFlow);
      setRaw(typeof data.raw === "string" ? data.raw : null);
    } catch (e: any) {
      setError(e?.message || "Failed to generate flow");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col border-l border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Sparkles size={14} />
          </div>
          <div>
            <div className="text-sm font-semibold text-ink">AI Assist</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">Prompt to flow</div>
          </div>
        </div>
        <button type="button" onClick={onClose} className="tf-focus rounded-md px-2 py-1 text-xs text-ink-2 hover:bg-surface-3">
          Close
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <p className="text-sm text-ink-2">Describe the workflow you want. AI will generate tasks, decisions, and connections.</p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="tf-focus w-full resize-y rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink"
          placeholder="e.g. Plan a sprint from backlog grooming to release, including QA and a go/no-go decision..."
        />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setPrompt(ex)}
              className="tf-focus rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-ink-2 hover:border-line-strong hover:bg-surface-3"
            >
              {ex}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading || !prompt.trim()}
          className="tf-focus inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-3 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
          {loading ? "Generating..." : "Generate flow"}
        </button>

        {error ? (
          <div className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger" role="alert">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="space-y-3 rounded-lg border border-line bg-surface-2 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-ink">Preview</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
                {result.nodes.length} stops · {result.edges.length} links
              </div>
            </div>
            {result.name ? <div className="text-xs text-ink-2">Suggested name: <span className="font-medium text-ink">{result.name}</span></div> : null}
            <ul className="max-h-48 space-y-1 overflow-auto text-sm">
              {result.nodes.slice(0, 12).map((n, i) => (
                <li key={n.id || i} className="flex items-center justify-between gap-2 rounded border border-line bg-surface px-2 py-1.5">
                  <span className="truncate text-ink">{n.title}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">{n.type}</span>
                </li>
              ))}
              {result.nodes.length > 12 ? <li className="text-xs text-ink-3">…and {result.nodes.length - 12} more</li> : null}
            </ul>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onApply(result, "merge")}
                className="tf-focus flex-1 rounded-lg border border-brand/30 bg-brand-soft px-3 py-2 text-sm font-medium text-brand-ink hover:bg-brand/10"
              >
                Merge into canvas
              </button>
              <button
                type="button"
                onClick={() => onApply(result, "replace")}
                className="tf-focus flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-surface-3"
              >
                Replace canvas
              </button>
            </div>
          </div>
        ) : null}

        {raw && process.env.NODE_ENV !== "production" ? null : null}
      </div>
      <div className="border-t border-line p-3 text-[11px] text-ink-3">
        Set <code className="font-mono">NVIDIA_API_KEY</code> in <code className="font-mono">.env.local</code> to enable generation.
      </div>
    </div>
  );
}
