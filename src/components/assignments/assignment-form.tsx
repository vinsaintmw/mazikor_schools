"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
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

export function AssignmentFormDialog({
  action,
  subjects,
  classes,
}: {
  action: (formData: FormData) => Promise<unknown>;
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          New assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New assignment</DialogTitle>
        </DialogHeader>
        <ActionForm
          action={action}
          onSuccess={() => {
            setOpen(false);
            toast.success("Assignment created");
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <TextInput name="title" label="Title" required placeholder="e.g. Essay: The Malawi Economy" className="sm:col-span-2" />
          <NativeSelect
            name="classId"
            label="Class"
            required
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select class"
          />
          <NativeSelect
            name="subjectId"
            label="Subject"
            required
            options={subjects.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="Select subject"
          />
          <TextInput name="dueDate" label="Due date" type="date" required className="sm:col-span-2" />
          <TextAreaField name="description" label="Description" rows={2} className="sm:col-span-2" />
          <TextAreaField name="instructions" label="Instructions" rows={3} className="sm:col-span-2" />
          <div className="flex justify-end sm:col-span-2">
            <SubmitButton>Create assignment</SubmitButton>
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
