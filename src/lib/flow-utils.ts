import { nanoid } from "nanoid";
import type { Edge, Node } from "@xyflow/react";
import type {
  ChecklistItem,
  DecisionNodeData,
  FlowEdge,
  FlowNode,
  FlowNodeData,
  GeneratedFlow,
  TaskNodeData,
} from "@/lib/types";

export function makeTaskNode(
  position: { x: number; y: number },
  partial?: Partial<Omit<TaskNodeData, "kind">>,
): Node<FlowNodeData> {
  return {
    id: nanoid(),
    type: "task",
    position,
    data: {
      kind: "task",
      title: partial?.title ?? "New Task",
      description: partial?.description ?? "",
      checklist: partial?.checklist ?? [],
      completed: partial?.completed ?? false,
    },
  };
}

export function makeDecisionNode(
  position: { x: number; y: number },
  partial?: Partial<Omit<DecisionNodeData, "kind">>,
): Node<FlowNodeData> {
  return {
    id: nanoid(),
    type: "decision",
    position,
    data: {
      kind: "decision",
      title: partial?.title ?? "Decision",
      description: partial?.description ?? "",
    },
  };
}

export function normalizeChecklist(
  items: GeneratedFlow["nodes"][number]["checklist"],
): ChecklistItem[] {
  if (!items) return [];
  return items.map((item) => {
    if (typeof item === "string") {
      return { id: nanoid(), text: item, done: false };
    }
    return { id: nanoid(), text: item.text, done: !!item.done };
  });
}

export function generatedToFlow(generated: GeneratedFlow): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const idMap = new Map<string, string>();
  const nodes: Node<FlowNodeData>[] = generated.nodes.map((n, i) => {
    const newId = nanoid();
    const sourceId = n.id ?? `n${i + 1}`;
    idMap.set(sourceId, newId);
    const col = i % 3;
    const row = Math.floor(i / 3);
    const position = { x: col * 340 + 80, y: row * 220 + 80 };
    if (n.type === "decision") {
      return makeDecisionNode(position, {
        title: n.title || "Decision",
        description: n.description ?? "",
      });
    }
    return makeTaskNode(position, {
      title: n.title || "Task",
      description: n.description ?? "",
      checklist: normalizeChecklist(n.checklist),
      completed: !!n.completed,
    });
  });

  // If generator used provided ids, map them in order
  generated.nodes.forEach((n, i) => {
    if (n.id) idMap.set(n.id, nodes[i].id);
  });

  const edges: Edge[] = (generated.edges || [])
    .map((e) => {
      const source = idMap.get(e.source) ?? e.source;
      const target = idMap.get(e.target) ?? e.target;
      if (!nodes.find((n) => n.id === source) || !nodes.find((n) => n.id === target)) {
        return null;
      }
      return {
        id: nanoid(),
        source,
        target,
        label: e.label,
        type: "smoothstep",
        animated: false,
      } as Edge;
    })
    .filter(Boolean) as Edge[];

  return { nodes, edges };
}

export function toStoredNodes(nodes: Node<FlowNodeData>[]): FlowNode[] {
  return nodes.map((n) => ({
    id: n.id,
    type: (n.type as "task" | "decision") ?? "task",
    position: n.position,
    data: n.data as FlowNodeData,
  }));
}

export function toStoredEdges(edges: Edge[]): FlowEdge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    label: typeof e.label === "string" ? e.label : undefined,
  }));
}

export function fromStoredNodes(nodes: FlowNode[]): Node<FlowNodeData>[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
  }));
}

export function fromStoredEdges(edges: FlowEdge[]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
    label: e.label,
    type: "smoothstep",
  }));
}
