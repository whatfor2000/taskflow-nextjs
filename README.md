# Taskflow

Taskflow is a Next.js + React Flow application that turns prompts into editable workflow/todolist graphs.

## Features

- **Dashboard**: create new flows, open existing flows, duplicate, and delete saved flows (stored in browser `localStorage`).
- **Visual editor**: Task and Decision nodes on a React Flow canvas with drag/connect handles.
- **Node editing**: click a node to edit title/description, manage checklist items, and mark tasks complete.
- **AI assistance**: send a prompt to Nvidia NIM (OpenAI-compatible chat completions) and parse structured JSON into nodes/edges (merge or replace canvas).
- **Auto-layout**: arrange nodes hierarchically Left-to-Right or Top-to-Bottom (Dagre).
- **PDF export**: export the current flow as a PDF containing a graph snapshot and a task summary table.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- `@xyflow/react` (React Flow)
- `@dagrejs/dagre` for layout
- `jspdf` + `html-to-image` for export

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Configure AI (Nvidia NIM) environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NVIDIA_API_KEY=your_nvidia_api_key_here
# Optional
# NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
# NVIDIA_NIM_MODEL=meta/llama-3.1-70b-instruct
```

> AI generation requires `NVIDIA_API_KEY` (or `NIM_API_KEY`). The app UI and manual editing work without it.

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

- **Prompt → flow**: the editor posts your prompt to `/api/generate`.
- **Server route** (`src/app/api/generate/route.ts`): packs a system prompt + user prompt, calls Nvidia NIM (`/v1/chat/completions`), expects structured JSON, and normalizes it.
- **Client parsing** (`src/lib/flow-utils.ts`): converts generated JSON into React Flow Task/Decision nodes and edges for interactive editing.

## Key files

- `src/app/page.tsx` — dashboard (flow management)
- `src/app/editor/[id]/page.tsx` — editor route (Suspense + client editor)
- `src/components/editor/EditorClient.tsx` — canvas, toolbar, persistence, AI/layout/export actions
- `src/components/flow/TaskNode.tsx`, `DecisionNode.tsx`, `RouteEdge.tsx` — custom React Flow elements
- `src/components/editor/DetailsPanel.tsx` — task/decision inspector and checklist editing
- `src/components/editor/AIPromptPanel.tsx` — AI prompt and merge/replace controls
- `src/lib/storage.ts` — localStorage flow CRUD
- `src/lib/layout.ts` — Dagre auto-layout

## Notes

- Flows are saved locally in the browser (no database/auth in this implementation).
- PDF export captures the graph viewport and appends a task/decision summary; complex graphs may render differently depending on browser capture limits.
- Build verification: `npm run build` passes.
