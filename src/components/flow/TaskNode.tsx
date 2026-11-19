"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import type { FlowNodeData, TaskNodeData } from "@/lib/types";

export default function TaskNode({ data, selected }: NodeProps) {
  const d = data as TaskNodeData & FlowNodeData;
  const total = d.checklist?.length ?? 0;
  const done = d.checklist?.filter((c) => c.done).length ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : d.completed ? 100 : 0;
  const isComplete = d.completed || (total > 0 && done === total);

  return (
    <div
      className={[
        "w-[220px] rounded-[10px] border bg-surface px-3 py-2.5 shadow-[0_1px_0_0_rgba(255,255,255,.7)_inset,0_8px_20px_-12px_rgba(16,26,44,.35)] transition",
        selected ? "ring-2 ring-brand ring-offset-2 ring-offset-canvas" : "border-line",
        isComplete ? "border-l-[3px] border-l-complete" : "border-l-[3px] border-l-brand",
      ].join(" ")}
    >
      <Handle type="target" position={Position.Left} className="!bg-surface" />
      <div className="flex items-start gap-2">
        <div
          className={[
            "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full",
            isComplete ? "bg-complete-soft text-complete" : "bg-brand-soft text-brand",
          ].join(" ")}
          aria-hidden
        >
          {isComplete ? <CheckCircle2 size={14} /> : <ListChecks size={14} />}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={[
              "truncate text-[13px] font-semibold text-ink",
              isComplete ? "line-through opacity-60" : "",
            ].join(" ")}
            title={d.title}
          >
            {d.title || "Untitled task"}
          </div>
          {d.description ? (
            <div className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-ink-2">
              {d.description}
            </div>
          ) : (
            <div className="mt-0.5 text-[12px] text-ink-3">No description</div>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
          <div
            className={["h-full rounded-full transition-all", isComplete ? "bg-complete" : "bg-brand"].join(" ")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
          {total > 0 ? `${done}/${total}` : isComplete ? "Done" : "T"}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-surface" />
    </div>
  );
}
