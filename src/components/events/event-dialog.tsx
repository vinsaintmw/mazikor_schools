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

const TYPES = ["SPORT", "ACADEMIC", "MEETING", "HOLIDAY", "EXCURSION", "OTHER"];
import { BRAND_COLORS } from "@/lib/constants";

const COLORS = Object.values(BRAND_COLORS);

export function EventDialog({
  action,
}: {
  action: (formData: FormData) => Promise<unknown>;
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
        <ActionForm
          action={action}
          onSuccess={() => {
            setOpen(false);
            toast.success("Event created");
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
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
