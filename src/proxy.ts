import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const APP_PREFIXES = [
  "/dashboard",
  "/students",
  "/parents",
  "/teachers",
  "/staff",
  "/classes",
  "/subjects",
  "/attendance",
  "/exams",
  "/results",
  "/report-cards",
  "/timetable",
  "/assignments",
  "/fees",
  "/invoices",
  "/payments",
  "/expenses",
  "/finance",
  "/notices",
  "/events",
  "/library",
  "/transport",
  "/inventory",
  "/hr",
  "/reports",
  "/settings",
];

const isAppPath = (pathname: string) =>
  APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
  pathname.startsWith("/admin");

export async function proxy(request: NextRequest) {
  const { pathname } = new URL(request.url);
  if (!isAppPath(pathname)) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/login") loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$).*)"],
};
