import * as motion from "motion/react-client";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { SignInWithGithub } from "@/app/components/auth/sign-in-with-github";
import { SignOutButton } from "@/app/components/auth/sign-out-button";
import { UserSummary } from "@/app/components/auth/user-summary";
import { MaterialAlert, MaterialIconSurface } from "@/app/components/material/primitives";
import {
  expressiveContainer,
  expressiveItem,
} from "@/app/components/material/motion";

type AuthPanelProps = {
  errorMessage: string | null;
  isConfigured: boolean;
  user?: {
    email: string;
    image?: string | null;
    name: string;
  } | null;
};

export function AuthPanel({ errorMessage, isConfigured, user }: AuthPanelProps) {
  const hasDeniedUser = Boolean(user);

  return (
    <motion.section
      animate="show"
      className="w-full"
      initial="hidden"
      variants={expressiveContainer}
    >
      <motion.div className="mb-10" variants={expressiveItem}>
        <motion.div
          className="mb-6"
          layout
        >
          <MaterialIconSurface size="lg" tone={hasDeniedUser ? "error" : "primary"}>
            {hasDeniedUser ? (
              <ShieldAlert className="size-8" aria-hidden="true" />
            ) : (
              <ShieldCheck className="size-8" aria-hidden="true" />
            )}
          </MaterialIconSurface>
        </motion.div>
        <h2 className="md-headline-medium md-emphasized text-on-surface">
          {hasDeniedUser ? "Access denied" : "Sign in"}
        </h2>
        <p className="mt-2 max-w-sm md-body-large text-on-surface-variant">
          {hasDeniedUser
            ? "This GitHub account is not allowed."
            : "Use an approved GitHub account to open the relay workspace."}
        </p>
      </motion.div>

      <motion.div
        className="border-y border-outline-variant py-6"
        variants={expressiveItem}
      >
        <div className="space-y-4">
          {errorMessage ? (
            <MaterialAlert title="Unable to continue" variant="error">
              {errorMessage}
            </MaterialAlert>
          ) : null}

          {user ? (
            <div className="space-y-4">
              <UserSummary email={user.email} image={user.image} name={user.name} />
              <SignOutButton />
            </div>
          ) : (
            <SignInWithGithub disabled={!isConfigured} />
          )}
        </div>
      </motion.div>

      <motion.p
        className="mt-6 md-label-medium text-on-surface-variant"
        variants={expressiveItem}
      >
        &copy; {new Date().getFullYear()} QuotaHub Relay
      </motion.p>
    </motion.section>
  );
}
