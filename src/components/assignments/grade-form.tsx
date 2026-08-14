"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gradeSubmission } from "@/lib/actions/academics";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { error } from "@/lib/action-result";

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

  const action = async () => {
    const num = parseFloat(g);
    if (!Number.isFinite(num) || num < 0) return error("Enter a valid grade.");
    return gradeSubmission(submissionId, num, fb);
  };

  return (
    <ActionForm
      action={action}
      successLabel="Saved"
      onSuccess={() => router.refresh()}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        value={g}
        onChange={(e) => setG(e.target.value)}
        type="number"
        min={0}
        step="0.5"
        placeholder="Grade"
        className="h-10 w-20 rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-8 sm:w-20 sm:text-sm dark:bg-input/30"
      />
      <input
        value={fb}
        onChange={(e) => setFb(e.target.value)}
        placeholder="Feedback"
        className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-8 sm:w-48 sm:text-sm dark:bg-input/30"
      />
      <SubmitButton size="sm">Save</SubmitButton>
    </ActionForm>
  );
}
