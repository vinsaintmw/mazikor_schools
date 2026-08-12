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
import { NOTICE_AUDIENCES } from "@/lib/constants";
import { todayISO } from "@/lib/format";

export function NoticeDialog({
  action,
  classes,
}: {
  action: (formData: FormData) => Promise<void>;
  classes: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState("EVERYONE");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          New notice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New notice</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await action(formData);
            setOpen(false);
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <TextInput name="title" label="Title" required placeholder="e.g. Sports day announced" className="sm:col-span-2" />
          <NativeSelect
            name="audience"
            label="Audience"
            required
            defaultValue={audience}
            onChange={(e) => setAudience(e.target.value)}
            options={NOTICE_AUDIENCES}
          />
          {audience === "CLASS" ? (
            <NativeSelect
              name="classId"
              label="Class"
              required
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select class"
            />
          ) : null}
          <TextInput name="publishDate" label="Publish date" type="date" defaultValue={todayISO()} />
          <TextInput name="expiryDate" label="Expiry date" type="date" />
          <TextAreaField name="content" label="Content" required rows={4} className="sm:col-span-2" />
          <div className="flex justify-end sm:col-span-2">
            <SubmitButton>Create notice</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
