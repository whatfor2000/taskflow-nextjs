"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";

export default function RouteEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, label, selected } =
    props;
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });
  const color = selected ? "var(--tf-brand)" : "var(--tf-line-strong)";

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ stroke: color, strokeWidth: 2.5 }} />
      <path d={edgePath} fill="none" stroke="var(--tf-surface)" strokeWidth={1.5} className="tf-route-pulse" opacity={0.9} />
      {label ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-2 shadow-sm"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
