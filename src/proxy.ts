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

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let response: NextResponse;
  if (isAppPath(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      if (pathname !== "/login") loginUrl.searchParams.set("callbackUrl", pathname);
      response = NextResponse.redirect(loginUrl);
    } else {
      response = NextResponse.next({ request: { headers: requestHeaders } });
    }
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$).*)"],
};
