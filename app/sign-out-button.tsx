"use client";

import { useTransition } from "react";
import { signOut } from "@/app/auth-actions";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await signOut();
          window.location.href = "/";
        });
      }}
      className="flex w-full items-center justify-center border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
