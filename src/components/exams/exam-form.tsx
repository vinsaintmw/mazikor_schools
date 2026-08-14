import { createExam, updateExam } from "@/lib/actions/academics";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { CancelButton } from "@/components/cancel-button";
import { TextInput, NativeSelect, TextAreaField } from "@/components/forms";
import { EXAM_TYPES, getLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export interface ExamFormData {
  id: string;
  name: string;
  type: string;
  termId: string;
  gradeScaleId: string | null;
  startDate: Date;
  endDate: Date;
  description: string | null;
}

export function ExamForm({
  exam,
  terms,
  gradeScales,
  mode,
}: {
  exam?: ExamFormData | null;
  terms: { id: string; name: string }[];
  gradeScales: { id: string; name: string }[];
  mode: "create" | "edit";
}) {
  const action = exam ? updateExam.bind(null, exam.id) : createExam;

  return (
    <ActionForm action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput name="name" label="Exam name" required defaultValue={exam?.name} placeholder="e.g. Form 3 Mid-Term 2026" className="sm:col-span-2" />
        <NativeSelect
          name="type"
          label="Type"
          required
          defaultValue={exam?.type ?? "TEST"}
          options={EXAM_TYPES.map((t) => ({ value: t, label: getLabel(t, EXAM_TYPES) }))}
        />
        <NativeSelect
          name="termId"
          label="Term"
          required
          defaultValue={exam?.termId ?? null}
          options={terms.map((t) => ({ value: t.id, label: t.name }))}
          placeholder="Select term"
        />
        <TextInput
          name="startDate"
          label="Start date"
          type="date"
          defaultValue={exam?.startDate ? formatDate(exam.startDate) : undefined}
        />
        <TextInput
          name="endDate"
          label="End date"
          type="date"
          defaultValue={exam?.endDate ? formatDate(exam.endDate) : undefined}
        />
        <NativeSelect
          name="gradeScaleId"
          label="Grading scale"
          defaultValue={exam?.gradeScaleId ?? null}
          options={gradeScales.map((g) => ({ value: g.id, label: g.name }))}
          placeholder="Default scale"
          className="sm:col-span-2"
        />
        <TextAreaField
          name="description"
          label="Description"
          defaultValue={exam?.description}
          rows={3}
          className="sm:col-span-2"
        />
      </div>
      <div className="flex justify-end gap-2">
        <CancelButton href={exam ? `/exams/${exam.id}` : "/exams"} />
        <SubmitButton>{mode === "create" ? "Create exam" : "Save changes"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
