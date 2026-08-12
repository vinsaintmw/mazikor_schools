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
import { TextInput, NativeSelect, TextAreaField } from "@/components/forms";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { todayISO } from "@/lib/format";

export function ExpenseDialog({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          New expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New expense</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await action(formData);
            setOpen(false);
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <NativeSelect
            name="category"
            label="Category"
            required
            options={EXPENSE_CATEGORIES}
            placeholder="Select category"
          />
          <TextInput name="amount" label="Amount (MK)" type="number" min={1} step="0.01" required placeholder="0.00" />
          <TextInput name="date" label="Date" type="date" defaultValue={todayISO()} />
          <NativeSelect name="method" label="Method" options={PAYMENT_METHODS} placeholder="Select method" />
          <TextInput name="vendor" label="Vendor" placeholder="e.g. ESCOM" className="sm:col-span-2" />
          <TextAreaField name="description" label="Description" required rows={2} placeholder="What was this for?" className="sm:col-span-2" />
          <TextAreaField name="notes" label="Notes" rows={2} className="sm:col-span-2" />
          <div className="flex justify-end sm:col-span-2">
            <SubmitButton>Create expense</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
