import { Suspense } from "react";
import EditorClient from "@/components/editor/EditorClient";

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-paper text-ink-2">Loading editor...</div>}>
      <EditorClient />
    </Suspense>
  );
}

