"use client";

import { nanoid } from "nanoid";
import { Plus, Trash2, X } from "lucide-react";
import type { Node } from "@xyflow/react";
import type { ChecklistItem, FlowNodeData, TaskNodeData, DecisionNodeData } from "@/lib/types";

export default function DetailsPanel({
  node,
  onChange,
  onDelete,
  onClose,
}: {
  node: Node<FlowNodeData> | null;
  onChange: (id: string, data: FlowNodeData) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  if (!node) {
    return (
      <aside className="flex h-full w-full flex-col border-l border-line bg-surface p-4">
        <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">Line overview</div>
        <p className="mt-3 text-sm text-ink-2">Select a task or decision node to edit its details.</p>
        <ul className="mt-4 space-y-2 text-sm text-ink-2">
          <li>• Click nodes to edit title, description, and checklist.</li>
          <li>• Drag handles to connect nodes.</li>
          <li>• Use the toolbar to add nodes, auto-layout, or export PDF.</li>
        </ul>
      </aside>
    );
  }

  const selectedNode = node;
  const data = selectedNode.data as FlowNodeData;
  const isTask = data.kind === "task";

  function update(patch: Partial<TaskNodeData> | Partial<DecisionNodeData>) {
    onChange(selectedNode.id, { ...data, ...patch } as FlowNodeData);
  }

  function updateChecklist(items: ChecklistItem[]) {
    if (!isTask) return;
    onChange(selectedNode.id, { ...(data as TaskNodeData), checklist: items });
  }

  return (
    <aside className="flex h-full w-full flex-col border-l border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
            {isTask ? "Task" : "Decision"} · {node.id.slice(0, 6)}
          </div>
          <div className="text-sm font-semibold text-ink">{isTask ? "Task details" : "Decision details"}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="tf-focus rounded-md p-1.5 text-ink-2 hover:bg-surface-3"
          aria-label="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-2">Title</span>
          <input
            value={data.title}
            onChange={(e) => update({ title: e.target.value })}
            className="tf-focus w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink"
            placeholder={isTask ? "Task title" : "Decision question"}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-2">Description</span>
          <textarea
            value={data.description}
            onChange={(e) => update({ description: e.target.value })}
            rows={4}
            className="tf-focus w-full resize-y rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink"
            placeholder="Add details..."
          />
        </label>

        {isTask ? (
          <>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={(data as TaskNodeData).completed}
                onChange={(e) => update({ completed: e.target.checked } as Partial<TaskNodeData>)}
                className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand"
              />
              Mark task as complete
            </label>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-ink-2">Checklist</span>
                <button
                  type="button"
                  onClick={() =>
                    updateChecklist([
                      ...((data as TaskNodeData).checklist || []),
                      { id: nanoid(), text: "", done: false },
                    ])
                  }
                  className="tf-focus inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-brand hover:bg-brand-soft"
                >
                  <Plus size={14} /> Add item
                </button>
              </div>
              <div className="space-y-2">
                {((data as TaskNodeData).checklist || []).map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 p-2">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={(e) => {
                        const next = [...(data as TaskNodeData).checklist];
                        next[idx] = { ...item, done: e.target.checked };
                        updateChecklist(next);
                      }}
                      className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand"
                      aria-label="Mark checklist item done"
                    />
                    <input
                      value={item.text}
                      onChange={(e) => {
                        const next = [...(data as TaskNodeData).checklist];
                        next[idx] = { ...item, text: e.target.value };
                        updateChecklist(next);
                      }}
                      className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
                      placeholder="Checklist item"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = (data as TaskNodeData).checklist.filter((_, i) => i !== idx);
                        updateChecklist(next);
                      }}
                      className="tf-focus rounded p-1 text-ink-3 hover:bg-danger-soft hover:text-danger"
                      aria-label="Remove item"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {((data as TaskNodeData).checklist || []).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-line p-3 text-xs text-ink-3">
                    No checklist items yet.
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-decision/30 bg-decision-soft/50 p-3 text-xs text-decision-ink">
            Decision nodes branch the flow. Connect outgoing edges and label them (e.g. Yes/No) to clarify paths.
          </div>
        )}
      </div>

      <div className="border-t border-line p-4">
        <button
          type="button"
          onClick={() => onDelete(node.id)}
          className="tf-focus inline-flex w-full items-center justify-center gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10"
        >
          <Trash2 size={16} /> Delete node
        </button>
      </div>
    </aside>
  );
}
