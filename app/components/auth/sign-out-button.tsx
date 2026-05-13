"use client";

import { useTransition } from "react";
import { signOut } from "@/app/actions/auth";
import { LogOut } from "lucide-react";
import { MaterialButton } from "@/app/components/material/primitives";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
  iconOnly?: boolean;
};

export function SignOutButton({ className, iconOnly }: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <MaterialButton
      variant="outlined"
      disabled={isPending}
      iconOnly={iconOnly}
      aria-label={iconOnly ? (isPending ? "Signing out" : "Sign out") : undefined}
      onClick={() => {
        startTransition(async () => {
          await signOut();
          window.location.href = "/";
        });
      }}
      className={cn(!iconOnly && "w-full", className)}
    >
      <LogOut className="size-4" aria-hidden="true" />
      {iconOnly ? (
        <span className="sr-only">{isPending ? "Signing out..." : "Sign out"}</span>
      ) : (
        isPending ? "Signing out..." : "Sign out"
      )}
    </MaterialButton>
  );
}
