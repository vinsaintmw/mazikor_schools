"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { unwrapAction } from "@/lib/action-result";

export function DeleteButton({
  action,
  confirmTitle = "Delete this record?",
  confirmDescription = "This action cannot be undone. The record will be permanently removed.",
  successMessage = "Deleted",
  label = "Delete",
  redirectTo,
  className,
}: {
  action: () => Promise<unknown>;
  confirmTitle?: string;
  confirmDescription?: string;
  successMessage?: string;
  label?: string;
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className={className}>
          <Trash2Icon className="size-3.5" />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={async (e) => {
              e.preventDefault();
              setPending(true);
              try {
                const result = await action();
                const unwrapped = unwrapAction(result);
                if (!unwrapped.ok) {
                  toast.error(unwrapped.error ?? "Could not delete. Please try again.");
                  return;
                }
                toast.success(successMessage);
                setOpen(false);
                if (redirectTo) router.replace(redirectTo);
                router.refresh();
              } catch (err) {
                console.error(err);
                toast.error("Something went wrong. Please try again.");
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
