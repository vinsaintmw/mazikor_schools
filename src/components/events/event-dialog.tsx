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

const TYPES = ["SPORT", "ACADEMIC", "MEETING", "HOLIDAY", "EXCURSION", "OTHER"];
const COLORS = ["#1d4ed8", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

export function EventDialog({
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
          New event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New event</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await action(formData);
            setOpen(false);
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <TextInput name="title" label="Title" required placeholder="e.g. Inter-house sports" className="sm:col-span-2" />
          <NativeSelect
            name="type"
            label="Type"
            required
            defaultValue="OTHER"
            options={TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ").toLowerCase() }))}
          />
          <TextInput name="startDate" label="Start date" type="date" required />
          <TextInput name="endDate" label="End date" type="date" />
          <TextInput name="location" label="Location" placeholder="e.g. School field" />
          <NativeSelect
            name="color"
            label="Colour"
            options={COLORS.map((c) => ({ value: c, label: c }))}
            placeholder="Pick a colour"
          />
          <TextAreaField name="description" label="Description" rows={3} className="sm:col-span-2" />
          <div className="flex justify-end sm:col-span-2">
            <SubmitButton>Create event</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
