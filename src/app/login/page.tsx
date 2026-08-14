import { redirect } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect(session.user.roleKey === "super_admin" ? "/admin" : "/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
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
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{APP_NAME}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{APP_TAGLINE}</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
