"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut className="size-4" aria-hidden />
      Sign out
    </Button>
  );
}
