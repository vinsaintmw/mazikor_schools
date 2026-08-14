import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { ROLE_PERMISSIONS, isSuperAdmin, type RoleKey } from "@/lib/constants";
import type { Permission } from "@/lib/constants";

export function resolvePermissions(roleKey: string, dbPermissions: string[]): Permission[] {
  if (isSuperAdmin(roleKey)) return Object.keys(ROLE_PERMISSIONS.super_admin);
  const builtIn = ROLE_PERMISSIONS[roleKey as RoleKey];
  return Array.from(new Set([...(builtIn ?? []), ...dbPermissions]));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 },
  pages: { signIn: "/login", error: "/login?error=1" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email.toLowerCase().trim() },
          include: {
            role: { include: { permissions: true } },
            school: true,
          },
        });
        if (!user) return null;
        if (!user.isActive) return null;
        if (user.schoolId && !user.school?.isActive) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        const permissions = resolvePermissions(
          user.role.key,
          user.role.permissions.map((p) => p.permission)
        );

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
          roleId: user.roleId,
          roleKey: user.role.key,
          roleName: user.role.name,
          schoolId: user.schoolId,
          schoolName: user.school?.name ?? null,
          permissions,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roleKey = (user as { roleKey?: string }).roleKey;
        token.roleName = (user as { roleName?: string }).roleName;
        token.schoolId = (user as { schoolId?: string | null }).schoolId ?? null;
        token.schoolName = (user as { schoolName?: string | null }).schoolName ?? null;
        token.permissions = (user as { permissions?: Permission[] }).permissions ?? [];
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.roleKey = (token.roleKey as string) ?? "";
        session.user.roleName = (token.roleName as string) ?? "";
        session.user.schoolId = (token.schoolId as string | null) ?? null;
        session.user.schoolName = (token.schoolName as string | null) ?? null;
        session.user.permissions = (token.permissions as Permission[]) ?? [];
      }
      return session;
    },
  },
});
