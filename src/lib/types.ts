export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type TaskNodeData = {
  kind: "task";
  title: string;
  description: string;
  checklist: ChecklistItem[];
  completed: boolean;
};

export type DecisionNodeData = {
  kind: "decision";
  title: string;
  description: string;
};

export type FlowNodeData = TaskNodeData | DecisionNodeData;

export type FlowNode = {
  id: string;
  type: "task" | "decision";
  position: { x: number; y: number };
  data: FlowNodeData;
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
};

export type FlowViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type FlowRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport?: FlowViewport;
};

export type GeneratedFlow = {
  name?: string;
  nodes: Array<{
    id?: string;
    type: "task" | "decision";
    title: string;
    description?: string;
    checklist?: Array<{ text: string; done?: boolean } | string>;
    completed?: boolean;
  }>;
  edges: Array<{
    source: string;
    target: string;
    label?: string;
  }>;
};
