"use client";

import { LogOutIcon, SettingsIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import type { Session } from "next-auth";

export function UserMenu({ session }: { session: Session }) {
  const name = session.user?.name ?? "User";
  const email = session.user?.email ?? "";
  const roleName = session.user?.roleName ?? "";
  const schoolName = session.user?.schoolName;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2">
          <Avatar className="size-7">
            <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-left lg:block">
            <span className="block max-w-32 truncate text-sm leading-tight font-medium">{name}</span>
            <span className="block max-w-32 truncate text-xs leading-tight text-muted-foreground">
              {roleName || schoolName}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="truncate text-sm font-medium">{name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
          </div>
          <div className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
            <span>{roleName}</span>
            {schoolName ? <span className="truncate">{schoolName}</span> : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <SettingsIcon className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOutIcon className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
