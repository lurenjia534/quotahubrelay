"use client";

import { useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import { GithubIcon } from "@/app/components/auth/github-icon";

type SignInWithGithubProps = {
  disabled?: boolean;
};

export function SignInWithGithub({ disabled }: SignInWithGithubProps) {
  const [isPending, setIsPending] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled || isPending}
      onClick={async () => {
        setIsPending(true);
        const { error } = await authClient.signIn.social({
          provider: "github",
          callbackURL: "/",
        });

        if (error) {
          setIsPending(false);
        }
      }}
      className="flex w-full items-center justify-center gap-2 border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      <GithubIcon />
      {isPending ? "Opening GitHub..." : "Continue with GitHub"}
    </button>
  );
}
