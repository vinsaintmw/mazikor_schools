import { createClass, updateClass } from "@/lib/actions/academics";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { CancelButton } from "@/components/cancel-button";
import { TextInput } from "@/components/forms";
import { NativeSelect } from "@/components/forms";

export interface ClassFormData {
  id: string;
  name: string;
  level: number;
  capacity: number;
  room: string | null;
  classTeacherId: string | null;
}

export function ClassForm({
  classData,
  teachers,
  mode,
}: {
  classData?: ClassFormData | null;
  teachers: { id: string; name: string }[];
  mode: "create" | "edit";
}) {
  const action = classData ? updateClass.bind(null, classData.id) : createClass;

  return (
    <ActionForm action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput name="name" label="Class name" required defaultValue={classData?.name} placeholder="e.g. Form 1" />
        <TextInput name="level" label="Level" type="number" min={1} max={12} defaultValue={classData?.level ?? 1} />
        <TextInput name="capacity" label="Capacity" type="number" min={1} defaultValue={classData?.capacity ?? 40} />
        <TextInput name="room" label="Room" defaultValue={classData?.room} placeholder="e.g. R-11" />
        <NativeSelect
          name="classTeacherId"
          label="Class teacher"
          defaultValue={classData?.classTeacherId ?? null}
          options={teachers.map((t) => ({ value: t.id, label: t.name }))}
          placeholder="Select a class teacher"
          className="sm:col-span-2"
        />
      </div>
      <div className="flex justify-end gap-2">
        <CancelButton href={classData ? `/classes/${classData.id}` : "/classes"} />
        <SubmitButton>{mode === "create" ? "Create class" : "Save changes"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
