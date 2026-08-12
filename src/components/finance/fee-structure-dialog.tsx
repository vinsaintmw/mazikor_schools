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
import { TextInput, NativeSelect } from "@/components/forms";

export interface FeeStructureValues {
  id: string;
  name: string;
  category: string;
  amount: number;
  classId: string | null;
  termId: string | null;
  isRequired: boolean;
  isActive: boolean;
}

export function FeeStructureDialog({
  action,
  fee,
  classes,
  terms,
  mode,
}: {
  action: (formData: FormData) => Promise<void>;
  fee?: FeeStructureValues | null;
  classes: { id: string; name: string }[];
  terms: { id: string; name: string }[];
  mode: "create" | "edit";
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button>
            <PlusIcon />
            New fee structure
          </Button>
        ) : (
          <Button variant="ghost" size="icon-sm" aria-label="Edit fee structure">
            <PencilIcon />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New fee structure" : "Edit fee structure"}</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await action(formData);
            setOpen(false);
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <TextInput name="name" label="Name" required defaultValue={fee?.name} placeholder="e.g. Tuition" />
          <TextInput name="category" label="Category" required defaultValue={fee?.category} placeholder="e.g. Fees" />
          <TextInput name="amount" label="Amount (MK)" type="number" min={0} step="0.01" required defaultValue={fee?.amount ?? ""} />
          <NativeSelect
            name="classId"
            label="Class"
            defaultValue={fee?.classId ?? null}
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="All classes"
          />
          <NativeSelect
            name="termId"
            label="Term"
            defaultValue={fee?.termId ?? null}
            options={terms.map((t) => ({ value: t.id, label: t.name }))}
            placeholder="All terms"
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isRequired" value="on" defaultChecked={fee?.isRequired ?? true} />
              Required
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" value="on" defaultChecked={fee?.isActive ?? true} />
              Active
            </label>
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <SubmitButton>{mode === "create" ? "Create fee structure" : "Save changes"}</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
