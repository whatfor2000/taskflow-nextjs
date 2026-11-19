"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  Download,
  LayoutGrid,
  PlusSquare,
  Sparkles,
  SplitSquareHorizontal,
  Waypoints,
} from "lucide-react";
import TaskNode from "@/components/flow/TaskNode";
import DecisionNode from "@/components/flow/DecisionNode";
import RouteEdge from "@/components/flow/RouteEdge";
import DetailsPanel from "@/components/editor/DetailsPanel";
import AIPromptPanel from "@/components/editor/AIPromptPanel";
import { getFlow, updateFlow } from "@/lib/storage";
import { getLayoutedElements } from "@/lib/layout";
import {
  fromStoredEdges,
  fromStoredNodes,
  generatedToFlow,
  makeDecisionNode,
  makeTaskNode,
  toStoredEdges,
  toStoredNodes,
} from "@/lib/flow-utils";
import type { FlowNodeData, FlowRecord, GeneratedFlow, TaskNodeData } from "@/lib/types";

const nodeTypes = { task: TaskNode, decision: DecisionNode };
const edgeTypes = { route: RouteEdge };

function EditorInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const flowId = params?.id as string;
  const { fitView, screenToFlowPosition, getNodes, getEdges } = useReactFlow();

  const [flow, setFlow] = useState<FlowRecord | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!flowId) return;
    const f = getFlow(flowId);
    if (!f) {
      setLoading(false);
      return;
    }
    setFlow(f);
    setName(f.name);
    setNodes(fromStoredNodes(f.nodes) as Node<FlowNodeData>[]);
    setEdges(fromStoredEdges(f.edges).map((e) => ({ ...e, type: "route" })));
    setLoading(false);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [flowId, setNodes, setEdges, fitView]);

  const persist = useCallback(
    (nextNodes: Node<FlowNodeData>[], nextEdges: Edge[], nextName?: string) => {
      if (!flowId) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        setSaving(true);
        updateFlow(flowId, {
          name: nextName ?? name,
          nodes: toStoredNodes(nextNodes),
          edges: toStoredEdges(nextEdges),
        });
        setSaving(false);
      }, 300);
    },
    [flowId, name],
  );

  useEffect(() => {
    if (!loading && flow) persist(nodes, edges, name);
  }, [nodes, edges, name, loading, flow, persist]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, type: "route" }, eds));
    },
    [setEdges],
  );

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedId) || null, [nodes, selectedId]);

  const addTask = useCallback(() => {
    const pos = screenToFlowPosition({ x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 80 });
    const node = makeTaskNode(pos);
    setNodes((nds) => nds.concat(node));
    setSelectedId(node.id);
  }, [screenToFlowPosition, setNodes]);

  const addDecision = useCallback(() => {
    const pos = screenToFlowPosition({ x: window.innerWidth / 2 - 80, y: window.innerHeight / 2 - 60 });
    const node = makeDecisionNode(pos);
    setNodes((nds) => nds.concat(node));
    setSelectedId(node.id);
  }, [screenToFlowPosition, setNodes]);

  const onNodeClick = useCallback((_e: any, node: Node) => {
    setSelectedId(node.id);
    setShowAI(false);
  }, []);

  const onPaneClick = useCallback(() => setSelectedId(null), []);

  const updateNodeData = useCallback(
    (id: string, data: FlowNodeData) => {
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data } : n)));
    },
    [setNodes],
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      if (selectedId === id) setSelectedId(null);
    },
    [setNodes, setEdges, selectedId],
  );

  const applyLayout = useCallback(
    (direction: "LR" | "TB") => {
      const { nodes: ln, edges: le } = getLayoutedElements(getNodes(), getEdges(), direction);
      setNodes([...ln] as Node<FlowNodeData>[]);
      setEdges([...le]);
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 20);
    },
    [getNodes, getEdges, setNodes, setEdges, fitView],
  );

  const onApplyAI = useCallback(
    (generated: GeneratedFlow, mode: "replace" | "merge") => {
      const { nodes: genNodes, edges: genEdges } = generatedToFlow(generated);
      if (mode === "replace") {
        setNodes(genNodes as Node<FlowNodeData>[]);
        setEdges(genEdges.map((e) => ({ ...e, type: "route" })));
        if (generated.name && (!name || name === "Untitled Flow")) setName(generated.name);
      } else {
        const offset = { x: 80, y: 80 };
        const mergedNodes = genNodes.map((n) => ({ ...n, position: { x: n.position.x + offset.x, y: n.position.y + offset.y } }));
        setNodes((nds) => nds.concat(mergedNodes as Node<FlowNodeData>[]));
        setEdges((eds) => eds.concat(genEdges.map((e) => ({ ...e, type: "route" }))));
      }
      setShowAI(false);
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
    },
    [setNodes, setEdges, fitView, name],
  );

  const exportPdf = useCallback(async () => {
    const viewport = document.querySelector(".react-flow__viewport") as HTMLElement | null;
    const currentNodes = getNodes() as Node<FlowNodeData>[];
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(name || "Taskflow", margin, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`Exported ${new Date().toLocaleString()} · ${currentNodes.length} nodes`, margin, 68);
    doc.setTextColor(20);

    let y = 90;
    if (viewport) {
      try {
        const dataUrl = await toPng(viewport, { backgroundColor: "#f7f9fb", pixelRatio: 2, cacheBust: true });
        const imgProps = doc.getImageProperties(dataUrl);
        const maxW = pageW - margin * 2;
        const maxH = pageH * 0.45;
        let w = maxW;
        let h = (imgProps.height * w) / imgProps.width;
        if (h > maxH) {
          h = maxH;
          w = (imgProps.width * h) / imgProps.height;
        }
        doc.addImage(dataUrl, "PNG", margin, y, w, h);
        y += h + 24;
      } catch {
        doc.text("(Could not render graph image)", margin, y);
        y += 20;
      }
    }

    if (y > pageH - 120) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Task Summary", margin, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const tasks = currentNodes.filter((n) => n.type === "task");
    const decisions = currentNodes.filter((n) => n.type === "decision");
    const lines: string[] = [];
    tasks.forEach((t, i) => {
      const d = t.data as TaskNodeData;
      const total = d.checklist?.length || 0;
      const done = d.checklist?.filter((c) => c.done).length || 0;
      const status = d.completed || (total > 0 && done === total) ? "[Done]" : `[${done}/${total || 0}]`;
      lines.push(`${i + 1}. ${status} ${d.title || "Untitled task"}`);
      if (d.description) lines.push(`   - ${d.description}`);
      (d.checklist || []).forEach((c) => lines.push(`     ${c.done ? "☑" : "☐"} ${c.text}`));
    });
    if (decisions.length) {
      lines.push("");
      lines.push("Decisions:");
      decisions.forEach((d, i) => lines.push(`D${i + 1}. ${d.data.title}${d.data.description ? ` — ${d.data.description}` : ""}`));
    }
    if (lines.length === 0) lines.push("No tasks yet.");

    lines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, pageW - margin * 2);
      wrapped.forEach((wline: string) => {
        if (y > pageH - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(wline, margin, y);
        y += 14;
      });
    });

    const safeName = (name || "taskflow").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
    doc.save(`${safeName}.pdf`);
  }, [getNodes, name]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-paper text-ink-2">Loading flow...</div>;
  }
  if (!flow) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper text-ink">
        <p>Flow not found.</p>
        <Link href="/" className="rounded-lg bg-brand px-4 py-2 text-sm text-white">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-paper">
      <header className="z-20 flex h-14 items-center justify-between border-b border-line bg-surface px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="tf-focus rounded-md p-2 text-ink-2 hover:bg-surface-3"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-40 truncate rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-ink hover:border-line focus:border-line focus:bg-surface-2 focus:outline-none sm:w-72"
              aria-label="Flow name"
            />
            <div className="px-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
              {flow.id.slice(0, 8)} · {saving ? "Saving..." : "Saved"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto sm:gap-2">
          <button type="button" onClick={addTask} className="tf-focus inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-surface-3" title="Add Task">
            <PlusSquare size={15} /> <span className="hidden sm:inline">Task</span>
          </button>
          <button type="button" onClick={addDecision} className="tf-focus inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-surface-3" title="Add Decision">
            <SplitSquareHorizontal size={15} /> <span className="hidden sm:inline">Decision</span>
          </button>
          <div className="mx-1 h-5 w-px bg-line" />
          <button type="button" onClick={() => applyLayout("LR")} className="tf-focus inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-surface-3" title="Auto-layout Left to Right">
            <Waypoints size={15} /> <span className="hidden md:inline">Layout LR</span>
          </button>
          <button type="button" onClick={() => applyLayout("TB")} className="tf-focus inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-surface-3" title="Auto-layout Top to Bottom">
            <LayoutGrid size={15} /> <span className="hidden md:inline">Layout TB</span>
          </button>
          <div className="mx-1 h-5 w-px bg-line" />
          <button
            type="button"
            onClick={() => { setShowAI((s) => !s); setSelectedId(null); }}
            className={["tf-focus inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium", showAI ? "border-brand/40 bg-brand-soft text-brand-ink" : "border-line bg-surface-2 text-ink hover:bg-surface-3"].join(" ")}
            title="AI Assist"
          >
            <Sparkles size={15} /> <span className="hidden sm:inline">AI Assist</span>
          </button>
          <button type="button" onClick={exportPdf} className="tf-focus inline-flex items-center gap-1.5 rounded-lg bg-brand px-2.5 py-1.5 text-xs font-medium text-white hover:brightness-110" title="Export to PDF">
            <Download size={15} /> <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1" ref={canvasRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: "route" }}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            minZoom={0.2}
            maxZoom={1.5}
            deleteKeyCode={["Backspace", "Delete"]}
            className="bg-canvas"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1.2} color="var(--tf-grid-dot)" />
            <MiniMap
              nodeColor={(n) => (n.type === "decision" ? "var(--tf-decision)" : "var(--tf-brand)")}
              maskColor="rgba(16,26,44,0.08)"
            />
            <Controls />
          </ReactFlow>
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-line bg-surface/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
            Drag handles to connect · Click node to edit
          </div>
        </div>

        <div className="hidden w-[340px] shrink-0 lg:block">
          {showAI ? (
            <AIPromptPanel onApply={onApplyAI} onClose={() => setShowAI(false)} />
          ) : (
            <DetailsPanel
              node={selectedNode}
              onChange={updateNodeData}
              onDelete={deleteNode}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      </div>

      <div className="lg:hidden">
        {(showAI || selectedNode) && (
          <div className="fixed inset-0 z-30 bg-black/20" onClick={() => { setShowAI(false); setSelectedId(null); }} />
        )}
        <div
          className={[
            "fixed bottom-0 right-0 top-14 z-40 w-full max-w-[360px] transform border-l border-line bg-surface shadow-2xl transition-transform",
            showAI || selectedNode ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          {showAI ? (
            <AIPromptPanel onApply={onApplyAI} onClose={() => setShowAI(false)} />
          ) : (
            <DetailsPanel
              node={selectedNode}
              onChange={updateNodeData}
              onDelete={deleteNode}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function EditorClient() {
  return (
    <ReactFlowProvider>
      <EditorInner />
    </ReactFlowProvider>
  );
}
