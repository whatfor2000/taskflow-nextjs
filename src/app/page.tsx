"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, Copy, FolderOpen, Loader2, Plus, Sparkles, Trash2, Workflow } from "lucide-react";
import { createFlow, deleteFlow, duplicateFlow, listFlows, updateFlow } from "@/lib/storage";
import { generatedToFlow, toStoredEdges, toStoredNodes } from "@/lib/flow-utils";
import type { FlowRecord, GeneratedFlow } from "@/lib/types";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

const EXAMPLES = [
  "Plan a product launch for a mobile app",
  "Create a sprint workflow from backlog to release",
  "Onboard a new engineer in their first 30 days",
  "Organize a content publishing pipeline with reviews",
];

export default function DashboardPage() {
  const router = useRouter();
  const [flows, setFlows] = useState<FlowRecord[]>([]);
  const [query, setQuery] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFlows(listFlows());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flows;
    return flows.filter((f) => f.name.toLowerCase().includes(q));
  }, [flows, query]);

  function refresh() {
    setFlows(listFlows());
  }

  function onCreateBlank() {
    const flow = createFlow("Untitled Flow");
    router.push(`/editor/${flow.id}`);
  }

  async function onGenerate() {
    const p = prompt.trim();
    if (!p || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate flow");
      }
      const generated = data.flow as GeneratedFlow;
      const { nodes, edges } = generatedToFlow(generated);
      const base = createFlow(generated.name?.trim() || "Generated Flow");
      const updated = updateFlow(base.id, {
        name: generated.name?.trim() || "Generated Flow",
        nodes: toStoredNodes(nodes),
        edges: toStoredEdges(edges),
      });
      router.push(`/editor/${(updated || base).id}`);
    } catch (e: any) {
      setError(e?.message || "Failed to generate flow");
    } finally {
      setGenerating(false);
    }
  }

  function onDelete(id: string) {
    if (!confirm("Delete this flow? This cannot be undone.")) return;
    deleteFlow(id);
    refresh();
  }

  function onDuplicate(id: string) {
    duplicateFlow(id);
    refresh();
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-brand/30 bg-brand-soft text-brand">
              <Workflow size={16} />
            </div>
            <div>
              <div className="font-display text-lg leading-none text-ink">Taskflow</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">Prompt → Tasks</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onCreateBlank}
            className="tf-focus inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-surface-3"
          >
            <Plus size={16} /> Blank canvas
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="mb-10 rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(16,26,44,.06),0_16px_40px_-20px_rgba(16,26,44,.18)] sm:p-7">
          <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-brand-ink">
            <Sparkles size={14} /> Main flow
          </div>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">Describe your task flow</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-2 sm:text-base">
            Start with a prompt. Taskflow sends it with a system prompt to your configured LLM (Nvidia NIM) and turns the solution into editable Task and Decision nodes.
          </p>

          <div className="mt-5 space-y-3">
            <label htmlFor="prompt" className="sr-only">Describe your task flow</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  onGenerate();
                }
              }}
              placeholder="Describe your task flow..."
              rows={4}
              className="tf-focus w-full resize-y rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-ink-3 sm:text-base"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCreateBlank}
                  className="tf-focus inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-surface-3"
                >
                  Skip to blank
                </button>
                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={!prompt.trim() || generating}
                  className="tf-focus inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generating ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {generating ? "Generating tasks..." : "Generate"}
                </button>
              </div>
            </div>
            <p className="text-xs text-ink-3">Tip: press Ctrl/Cmd + Enter to generate. Configure <code className="font-mono">NVIDIA_API_KEY</code> in <code className="font-mono">.env.local</code>.</p>
            {error ? (
              <div className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger" role="alert">
                {error}
              </div>
            ) : null}
          </div>
        </section>

        <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl text-ink">Saved flows</h2>
            <p className="mt-1 text-sm text-ink-2">Open, duplicate, or delete previously generated and edited flows.</p>
          </div>
          <div className="rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">
            {flows.length} flow{flows.length === 1 ? "" : "s"}
          </div>
        </section>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search flows..."
            className="tf-focus w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink sm:max-w-sm"
            aria-label="Search flows"
          />
          <div className="text-xs text-ink-3">Flows are stored locally in this browser.</div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Workflow size={22} />
            </div>
            <h3 className="font-display text-xl text-ink">No saved flows yet</h3>
            <p className="mt-1 text-sm text-ink-2">Generate from a prompt above or start from a blank canvas.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <button
              type="button"
              onClick={onCreateBlank}
              className="tf-focus group flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface p-5 text-center transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_16px_40px_-20px_rgba(16,26,44,.28)]"
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Plus size={18} />
              </div>
              <div className="font-medium text-ink">Start a blank flow</div>
              <div className="mt-1 text-xs text-ink-3">Manual canvas</div>
            </button>

            {filtered.map((flow, idx) => {
              const taskCount = flow.nodes.filter((n) => n.type === "task").length;
              const doneCount = flow.nodes.filter(
                (n) => n.type === "task" && (n.data as any).completed,
              ).length;
              return (
                <div
                  key={flow.id}
                  className="group rounded-xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_16px_40px_-20px_rgba(16,26,44,.28)] animate-fade-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
                        {flow.id.slice(0, 8)}
                      </div>
                      <h3 className="truncate text-base font-semibold text-ink" title={flow.name}>
                        {flow.name}
                      </h3>
                    </div>
                  </div>
                  <div className="mb-3 rounded-lg border border-line bg-canvas p-3">
                    <div className="flex h-16 items-center justify-center gap-1 text-ink-3">
                      {flow.nodes.slice(0, 5).map((n, i) => (
                        <div key={n.id} className="flex items-center gap-1">
                          <div
                            className={[
                              "h-3 w-3 rounded-full border",
                              n.type === "decision" ? "border-decision bg-decision-soft" : "border-brand bg-brand-soft",
                            ].join(" ")}
                          />
                          {i < Math.min(flow.nodes.length, 5) - 1 ? <div className="h-px w-4 bg-line-strong" /> : null}
                        </div>
                      ))}
                      {flow.nodes.length === 0 ? <span className="text-xs">Empty canvas</span> : null}
                    </div>
                  </div>
                  <div className="mb-3 flex items-center justify-between text-xs text-ink-2">
                    <span>{flow.nodes.length} nodes · {taskCount} tasks</span>
                    <span className="font-mono text-[10px] text-ink-3">{doneCount}/{taskCount} done</span>
                  </div>
                  <div className="mb-3 flex items-center gap-1 text-[11px] text-ink-3">
                    <Clock3 size={12} /> Updated {formatDate(flow.updatedAt)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/editor/${flow.id}`}
                      className="tf-focus inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:brightness-110"
                    >
                      <FolderOpen size={15} /> Open
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDuplicate(flow.id)}
                      className="tf-focus inline-flex items-center justify-center rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-ink-2 hover:bg-surface-3"
                      aria-label={`Duplicate ${flow.name}`}
                      title="Duplicate"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(flow.id)}
                      className="tf-focus inline-flex items-center justify-center rounded-lg border border-danger/20 bg-danger-soft px-2.5 py-2 text-danger hover:bg-danger/10"
                      aria-label={`Delete ${flow.name}`}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
