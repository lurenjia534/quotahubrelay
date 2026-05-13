"use client";

import { useTransition } from "react";
import { signOut } from "@/app/actions/auth";
import { LogOut } from "lucide-react";
import { MaterialButton } from "@/app/components/material/primitives";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <MaterialButton
      variant="outlined"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await signOut();
          window.location.href = "/";
        });
      }}
      className={cn("w-full", className)}
    >
      <LogOut className="size-4" aria-hidden="true" />
      {isPending ? "Signing out..." : "Sign out"}
    </MaterialButton>
  );
}
