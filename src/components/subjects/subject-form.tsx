"use client";

import { useState } from "react";
import { PlusIcon, PencilIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { ActionForm } from "@/components/action-form";
import { TextInput, NativeSelect, TextAreaField } from "@/components/forms";
import { toast } from "sonner";

export interface SubjectFormValues {
  id?: string;
  code: string;
  name: string;
  description: string | null;
  departmentId: string | null;
  passMark: number;
  maxMark: number;
}

export function SubjectFormDialog({
  action,
  subject,
  departments,
  mode,
}: {
  action: (formData: FormData) => Promise<unknown>;
  subject?: SubjectFormValues | null;
  departments: { id: string; name: string }[];
  mode: "create" | "edit";
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button>
            <PlusIcon />
            New subject
          </Button>
        ) : (
          <Button variant="ghost" size="icon-sm" aria-label="Edit subject">
            <PencilIcon />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New subject" : "Edit subject"}</DialogTitle>
        </DialogHeader>
        <ActionForm
          action={action}
          onSuccess={() => {
            setOpen(false);
            toast.success(mode === "create" ? "Subject created" : "Subject updated");
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <TextInput name="code" label="Code" required defaultValue={subject?.code} placeholder="e.g. MTH" />
          <TextInput name="name" label="Name" required defaultValue={subject?.name} placeholder="e.g. Mathematics" />
          <NativeSelect
            name="departmentId"
            label="Department"
            defaultValue={subject?.departmentId ?? null}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            placeholder="Select department"
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput name="passMark" label="Pass mark" type="number" min={0} max={100} defaultValue={subject?.passMark ?? 40} />
            <TextInput name="maxMark" label="Max mark" type="number" min={1} defaultValue={subject?.maxMark ?? 100} />
          </div>
          <TextAreaField name="description" label="Description" defaultValue={subject?.description} rows={2} className="sm:col-span-2" />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <SubmitButton>{mode === "create" ? "Create subject" : "Save changes"}</SubmitButton>
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
