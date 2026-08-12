import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roleKey: string;
      roleName: string;
      schoolId: string | null;
      schoolName: string | null;
      permissions: string[];
    } & DefaultSession["user"];
  }

  interface User {
    roleId?: string;
    roleKey?: string;
    roleName?: string;
    schoolId?: string | null;
    schoolName?: string | null;
    permissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roleKey?: string;
    roleName?: string;
    schoolId?: string | null;
    schoolName?: string | null;
    permissions?: string[];
  }
}
