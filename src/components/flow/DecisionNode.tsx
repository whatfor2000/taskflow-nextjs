"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Diamond } from "lucide-react";
import type { DecisionNodeData, FlowNodeData } from "@/lib/types";

export default function DecisionNode({ data, selected }: NodeProps) {
  const d = data as DecisionNodeData & FlowNodeData;
  return (
    <div
      className={[
        "w-[180px] rounded-[10px] border bg-decision-soft px-3 py-2.5 shadow-[0_1px_0_0_rgba(255,255,255,.5)_inset,0_8px_20px_-12px_rgba(16,26,44,.25)] transition",
        selected ? "ring-2 ring-decision ring-offset-2 ring-offset-canvas border-decision/60" : "border-decision/40",
      ].join(" ")}
    >
      <Handle type="target" position={Position.Left} className="!bg-surface" />
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-decision/50 bg-decision text-white">
          <Diamond size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-decision-ink" title={d.title}>
            {d.title || "Decision"}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-decision-ink/80">
            Branch point
          </div>
        </div>
      </div>
      {d.description ? (
        <div className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-decision-ink/90">{d.description}</div>
      ) : null}
      <Handle type="source" position={Position.Right} id="yes" style={{ top: "35%" }} className="!bg-surface" />
      <Handle type="source" position={Position.Right} id="no" style={{ top: "65%" }} className="!bg-surface" />
      <div className="pointer-events-none absolute -right-7 top-[22%] rounded bg-surface px-1 py-0.5 font-mono text-[9px] text-ink-3 border border-line">
        YES
      </div>
      <div className="pointer-events-none absolute -right-6 top-[58%] rounded bg-surface px-1 py-0.5 font-mono text-[9px] text-ink-3 border border-line">
        NO
      </div>
    </div>
  );
}
