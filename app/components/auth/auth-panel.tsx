import { ShieldAlert, ShieldCheck } from "lucide-react";
import { SignInWithGithub } from "@/app/components/auth/sign-in-with-github";
import { SignOutButton } from "@/app/components/auth/sign-out-button";
import { UserSummary } from "@/app/components/auth/user-summary";
import { MaterialAlert } from "@/app/components/material/primitives";

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
    <section className="expressive-enter-delayed w-full">
      <div className="mb-10">
        <span className="mb-6 grid size-16 place-items-center rounded-[var(--md-sys-shape-corner-large-increased)] bg-primary-container text-on-primary-container">
          {hasDeniedUser ? (
            <ShieldAlert className="size-8" aria-hidden="true" />
          ) : (
            <ShieldCheck className="size-8" aria-hidden="true" />
          )}
        </span>
        <h2 className="md-headline-medium md-emphasized text-on-surface">
          {hasDeniedUser ? "Access denied" : "Sign in"}
        </h2>
        <p className="mt-2 max-w-sm md-body-large text-on-surface-variant">
          {hasDeniedUser
            ? "This GitHub account is not allowed."
            : "Use an approved GitHub account to open the relay workspace."}
        </p>
      </div>

      <div className="border-y border-outline-variant py-6">
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
      </div>

      <p className="mt-6 md-label-medium text-on-surface-variant">
        &copy; {new Date().getFullYear()} QuotaHub Relay
      </p>
    </section>
  );
}
