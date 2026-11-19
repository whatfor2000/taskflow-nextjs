import dagre from "@dagrejs/dagre";
import { Position, type Edge, type Node } from "@xyflow/react";

const NODE_WIDTH = 280;
const NODE_HEIGHT = 140;

export type LayoutDirection = "LR" | "TB";

export function getLayoutedElements<T extends Node, E extends Edge>(
  nodes: T[],
  edges: E[],
  direction: LayoutDirection = "LR",
): { nodes: T[]; edges: E[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  const isHorizontal = direction === "LR";
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 90, marginx: 20, marginy: 20 });

  nodes.forEach((node) => {
    const width = (node.measured?.width as number | undefined) ?? NODE_WIDTH;
    const height = (node.measured?.height as number | undefined) ?? NODE_HEIGHT;
    g.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    const width = (node.measured?.width as number | undefined) ?? NODE_WIDTH;
    const height = (node.measured?.height as number | undefined) ?? NODE_HEIGHT;
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    } as T;
  });

  return { nodes: layoutedNodes, edges };
}

