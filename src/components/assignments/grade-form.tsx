"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gradeSubmission } from "@/lib/actions/academics";
import { SubmitButton } from "@/components/submit-button";

export function GradeForm({
  submissionId,
  grade,
  feedback,
}: {
  submissionId: string;
  grade: number | null;
  feedback: string | null;
}) {
  const router = useRouter();
  const [g, setG] = useState<string>(grade != null ? String(grade) : "");
  const [fb, setFb] = useState<string>(feedback ?? "");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async () => {
        setError(null);
        const num = parseFloat(g);
        if (!Number.isFinite(num) || num < 0) {
          setError("Enter a valid grade.");
          return;
        }
        await gradeSubmission(submissionId, num, fb);
        router.refresh();
      }}
      className="flex items-center gap-2"
    >
      <input
        value={g}
        onChange={(e) => setG(e.target.value)}
        type="number"
        min={0}
        step="0.5"
        placeholder="Grade"
        className="h-8 w-20 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      />
      <input
        value={fb}
        onChange={(e) => setFb(e.target.value)}
        placeholder="Feedback"
        className="h-8 w-48 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      />
      <SubmitButton size="sm">Save</SubmitButton>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </form>
  );
}
