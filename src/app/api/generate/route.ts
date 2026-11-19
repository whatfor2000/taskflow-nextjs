import { NextResponse } from "next/server";
import type { GeneratedFlow } from "@/lib/types";

const SYSTEM_PROMPT = `You are Taskflow AI, a planner that converts a user's request into a workflow graph.
Return ONLY valid JSON (no markdown fences, no commentary) matching this schema:
{
  "name": "short flow name",
  "nodes": [
    {
      "id": "n1",
      "type": "task" | "decision",
      "title": "short title",
      "description": "1-2 sentence description",
      "checklist": ["step 1", "step 2"], // tasks only, optional
      "completed": false
    }
  ],
  "edges": [
    { "source": "n1", "target": "n2", "label": "optional label like Yes/No" }
  ]
}
Rules:
- Use clear, actionable task titles.
- Use "decision" nodes for branch points/questions and connect outcomes with labeled edges (e.g. Yes/No).
- Keep 4-12 nodes unless the request clearly needs more.
- Every edge source/target must reference a node id from nodes.
- Prefer a logical left-to-right flow.`;

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // try to extract fenced or embedded JSON
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) return JSON.parse(fence[1].trim());
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Failed to parse JSON from model response");
  }
}

function coerceGenerated(data: any): GeneratedFlow {
  if (!data || typeof data !== "object") throw new Error("Invalid response shape");
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  const edges = Array.isArray(data.edges) ? data.edges : [];
  return {
    name: typeof data.name === "string" ? data.name : undefined,
    nodes: nodes.map((n: any, i: number) => ({
      id: typeof n?.id === "string" ? n.id : `n${i + 1}`,
      type: n?.type === "decision" ? "decision" : "task",
      title: typeof n?.title === "string" ? n.title : `Step ${i + 1}`,
      description: typeof n?.description === "string" ? n.description : "",
      checklist: Array.isArray(n?.checklist) ? n.checklist : undefined,
      completed: !!n?.completed,
    })),
    edges: edges
      .filter((e: any) => e && typeof e.source === "string" && typeof e.target === "string")
      .map((e: any) => ({
        source: e.source,
        target: e.target,
        label: typeof e.label === "string" ? e.label : undefined,
      })),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.NVIDIA_API_KEY || process.env.NIM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Missing NVIDIA API key. Set NVIDIA_API_KEY (or NIM_API_KEY) in your environment to use AI generation.",
        },
        { status: 500 },
      );
    }

    const baseUrl = process.env.NVIDIA_NIM_BASE_URL || "https://integrate.api.nvidia.com/v1";
    const model = process.env.NVIDIA_NIM_MODEL || "meta/llama-3.1-70b-instruct";

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        stream: false,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      return NextResponse.json(
        { error: `NVIDIA NIM request failed (${upstream.status})`, detail: errText.slice(0, 500) },
        { status: 502 },
      );
    }

    const completion = await upstream.json();
    const content: string | undefined = completion?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Empty response from model" }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = extractJson(content);
    } catch (e) {
      return NextResponse.json(
        { error: "Model response was not valid JSON", raw: content },
        { status: 502 },
      );
    }

    const flow = coerceGenerated(parsed);
    if (!flow.nodes.length) {
      return NextResponse.json({ error: "Model returned no nodes", raw: content }, { status: 502 });
    }

    return NextResponse.json({ flow, raw: content });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error generating flow" },
      { status: 500 },
    );
  }
}
