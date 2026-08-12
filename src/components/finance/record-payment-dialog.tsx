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
import { TextInput, NativeSelect } from "@/components/forms";
import { PAYMENT_METHODS } from "@/lib/constants";
import { todayISO } from "@/lib/format";

export function RecordPaymentDialog({
  action,
  invoices,
}: {
  action: (formData: FormData) => Promise<void>;
  invoices: { id: string; number: string; studentName: string; amount: number; paid: number }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          Record payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await action(formData);
            setOpen(false);
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <NativeSelect
            name="invoiceId"
            label="Invoice"
            required
            options={invoices.map((i) => ({
              value: i.id,
              label: `${i.number} · ${i.studentName} · ${i.amount.toLocaleString()} (${i.paid.toLocaleString()} paid)`,
            }))}
            placeholder="Select invoice"
            className="sm:col-span-2"
          />
          <TextInput name="amount" label="Amount (MK)" type="number" min={1} step="0.01" required placeholder="0.00" />
          <NativeSelect name="method" label="Method" required options={PAYMENT_METHODS} placeholder="Select method" />
          <TextInput name="date" label="Date" type="date" defaultValue={todayISO()} />
          <TextInput name="reference" label="Reference" placeholder="Optional" />
          <TextInput name="notes" label="Notes" className="sm:col-span-2" />
          <div className="flex justify-end sm:col-span-2">
            <SubmitButton>Record payment</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
