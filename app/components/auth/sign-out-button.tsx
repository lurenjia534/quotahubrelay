"use client";

import { useTransition } from "react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await signOut();
          window.location.href = "/";
        });
      }}
      className={cn("w-full", className)}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
