"use client";

import { useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import { GithubIcon } from "@/app/components/auth/github-icon";
import { MaterialButton } from "@/app/components/material/primitives";

type SignInWithGithubProps = {
  disabled?: boolean;
};

export function SignInWithGithub({ disabled }: SignInWithGithubProps) {
  const [isPending, setIsPending] = useState(false);

  return (
    <MaterialButton
      variant="filled"
      size="lg"
      className="w-full"
      disabled={disabled || isPending}
      onClick={async () => {
        setIsPending(true);
        const { error } = await authClient.signIn.social({
          provider: "github",
          callbackURL: "/dashboard",
        });

        if (error) {
          setIsPending(false);
        }
      }}
    >
      <GithubIcon />
      {isPending ? "Opening GitHub..." : "Continue with GitHub"}
    </MaterialButton>
  );
}
