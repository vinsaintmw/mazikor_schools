"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2Icon, LogInIcon, AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const DEMO_ACCOUNTS = [
  { role: "Super Admin", email: "superadmin@mazikor.mw" },
  { role: "School Admin", email: "admin@mazikor.mw" },
  { role: "Principal", email: "principal@mazikor.mw" },
  { role: "Teacher", email: "chisomo.banda@mazikor.mw" },
  { role: "Accountant", email: "accountant@mazikor.mw" },
  { role: "Parent", email: "parent@mazikor.mw" },
  { role: "Student", email: "student@mazikor.mw" },
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const urlError = searchParams.get("error")
    ? "Invalid email or password. Please try again."
    : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password.");
      } else {
        toast.success("Signed in");
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function fillDemo(email: string) {
    setEmail(email);
    setPassword("Mazikor2026!");
    setError("");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-background p-6 shadow-sm">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.mw"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error || urlError ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error || urlError}</p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? <Loader2Icon className="size-4 animate-spin" /> : <LogInIcon className="size-4" />}
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </div>

      {demoMode ? (
        <div className="mt-6 border-t pt-4">
          <p className="mb-2 text-center text-xs text-muted-foreground">
            Demo accounts — password <span className="font-mono">Mazikor2026!</span>
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => fillDemo(a.email)}
                className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {a.role}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  );
}
