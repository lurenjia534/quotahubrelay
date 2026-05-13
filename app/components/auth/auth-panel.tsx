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
    <section className="expressive-enter-delayed rounded-[var(--md-sys-shape-corner-extra-extra-large)] bg-surface px-5 py-6 shadow-[0_8px_24px_rgb(0_0_0/0.10)] sm:px-6 sm:py-7">
      <div className="mb-6 flex items-start gap-4">
        <span className="grid size-14 place-items-center rounded-[var(--md-sys-shape-corner-large-increased)] bg-primary-container text-on-primary-container">
          {hasDeniedUser ? (
            <ShieldAlert className="size-7" aria-hidden="true" />
          ) : (
            <ShieldCheck className="size-7" aria-hidden="true" />
          )}
        </span>
        <div>
          <h2 className="md-headline-small md-emphasized text-on-surface">
            {hasDeniedUser ? "Access denied" : "Sign in"}
          </h2>
          <p className="mt-1 md-body-medium text-on-surface-variant">
            {hasDeniedUser
              ? "This GitHub account is not allowed."
              : "Continue with an approved GitHub account."}
          </p>
        </div>
      </div>

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

      <p className="mt-8 text-center md-label-medium text-on-surface-variant">
        &copy; {new Date().getFullYear()} QuotaHub Relay
      </p>
    </section>
  );
}
