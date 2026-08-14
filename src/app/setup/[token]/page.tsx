import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/actions/super-admin";
import { SetupPasswordForm } from "@/components/auth/setup-password-form";

export const metadata: Metadata = {
  title: "Set your password",
  robots: { index: false, follow: false },
};

export default async function SetupPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await db.schoolInvitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { school: true },
  });
  if (!invitation) notFound();

  const invalid = Boolean(invitation.revokedAt) || invitation.usedAt != null;
  const expired = invitation.expiresAt < new Date();
  const suspended = !invitation.school.isActive;

  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/40 px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl">
          <Image
            src="/logo.png"
            alt={`${APP_NAME} logo`}
            width={1024}
            height={1024}
            className="size-12 object-contain"
            priority
          />
        </div>
        {invalid ? (
          <div className="max-w-md space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">Link not available</h1>
            <p className="text-sm text-muted-foreground">
              This setup link is invalid or has already been used. Contact your platform administrator to generate a new
              one.
            </p>
          </div>
        ) : expired ? (
          <div className="max-w-md space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">Link expired</h1>
            <p className="text-sm text-muted-foreground">
              This setup link expired on {invitation.expiresAt.toLocaleDateString()}. Contact your platform administrator
              to generate a new one.
            </p>
          </div>
        ) : suspended ? (
          <div className="max-w-md space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">Account suspended</h1>
            <p className="text-sm text-muted-foreground">
              Your school account has been suspended. Contact support for assistance.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Welcome, {invitation.name}</h1>
            <p className="text-sm text-muted-foreground">
              Finish setting up the administrator account for {invitation.school.name}.
            </p>
          </>
        )}
      </div>

      {!invalid && !expired && !suspended ? (
        <SetupPasswordForm token={token} name={invitation.name} email={invitation.email} />
      ) : null}
    </div>
  );
}
