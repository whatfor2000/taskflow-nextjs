import type { FlowEdge, FlowNode, FlowRecord, FlowViewport } from "@/lib/types";

const STORAGE_KEY = "taskflow.flows.v1";

function nowIso() {
  return new Date().toISOString();
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function listFlows(): FlowRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FlowRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

function saveAll(flows: FlowRecord[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
}

export function getFlow(id: string): FlowRecord | null {
  return listFlows().find((f) => f.id === id) ?? null;
}

export function createFlow(name = "Untitled Flow"): FlowRecord {
  const id = crypto.randomUUID();
  const flow: FlowRecord = {
    id,
    name,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
  const flows = listFlows();
  saveAll([flow, ...flows.filter((f) => f.id !== id)]);
  return flow;
}

export function updateFlow(
  id: string,
  patch: Partial<Pick<FlowRecord, "name" | "nodes" | "edges" | "viewport">>,
): FlowRecord | null {
  const flows = listFlows();
  const idx = flows.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  const updated: FlowRecord = {
    ...flows[idx],
    ...patch,
    updatedAt: nowIso(),
  };
  flows[idx] = updated;
  saveAll(flows);
  return updated;
}

export function deleteFlow(id: string) {
  const flows = listFlows().filter((f) => f.id !== id);
  saveAll(flows);
}

export function duplicateFlow(id: string): FlowRecord | null {
  const original = getFlow(id);
  if (!original) return null;
  const copy = createFlow(`${original.name} (copy)`);
  return updateFlow(copy.id, {
    nodes: original.nodes,
    edges: original.edges,
    viewport: original.viewport,
  });
}
