"use client";

import { useFormStatus } from "react-dom";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className,
  size = "default",
  variant = "default",
}: {
  children?: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "xs" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size={size} variant={variant} className={className}>
      {pending ? <Loader2Icon className="size-4 animate-spin" /> : null}
      {pending ? pendingLabel : (children ?? "Save")}
    </Button>
  );
}
