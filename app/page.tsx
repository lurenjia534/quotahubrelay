import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Activity, KeyRound, RadioTower } from "lucide-react";
import { auth, isAuthConfigured, isAuthorizedUser } from "@/app/lib/auth";
import { AuthPanel } from "@/app/components/auth/auth-panel";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  auth_not_configured:
    "GitHub SSO is not configured. Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, BETTER_AUTH_SECRET, BETTER_AUTH_URL, and AUTH_ALLOWED_EMAILS.",
  access_denied: "This app is restricted to an allowed GitHub account.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session?.user;
  const error = (await searchParams)?.error;
  const isConfigured = isAuthConfigured();
  const isAuthorized = isAuthorizedUser(user);
  const errorMessage = !isConfigured
    ? errorMessages.auth_not_configured
    : user && !isAuthorized
      ? errorMessages.access_denied
      : error
    ? (errorMessages[error] ?? "Unable to sign in. Please try again.")
    : null;

  if (user && isAuthorized) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-svh flex-1 bg-background">
      <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_480px]">
        <section className="relative overflow-hidden px-6 py-8 sm:px-10 lg:px-14">
          <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,var(--md-sys-color-primary),var(--md-sys-color-secondary),var(--md-sys-color-tertiary))]" />
          <div className="relative flex min-h-full flex-col justify-between gap-12">
            <div className="expressive-enter flex items-center gap-3">
              <span className="grid size-14 place-items-center rounded-[var(--md-sys-shape-corner-large-increased)] bg-primary text-xl font-bold text-on-primary shadow-lg shadow-primary/20">
                Q
              </span>
              <div>
                <p className="md-title-large md-emphasized text-on-surface">
                  QuotaHub Relay
                </p>
                <p className="md-body-medium text-on-surface-variant">
                  Server-side quota snapshots
                </p>
              </div>
            </div>

            <div className="expressive-enter grid max-w-5xl gap-10 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
              <div>
                <p className="mb-4 inline-flex rounded-full bg-tertiary-container px-4 py-2 md-label-large md-emphasized text-on-tertiary-container">
                  Private relay console
                </p>
                <h1 className="md-display-large text-on-surface">
                  Normalize provider quotas before clients ask.
                </h1>
                <p className="mt-6 max-w-xl md-body-large text-on-surface-variant">
                  Connect approved provider credentials on the server, then expose
                  controlled quota state to trusted clients.
                </p>
              </div>
              <QuotaFlowVisual />
            </div>

            <div className="expressive-enter-delayed grid max-w-3xl divide-y divide-outline-variant overflow-hidden rounded-[var(--md-sys-shape-corner-extra-large)] bg-surface-container-low sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <SignalTile
                icon={<RadioTower className="size-5" aria-hidden="true" />}
                label="Relay"
                value="Server held"
              />
              <SignalTile
                icon={<Activity className="size-5" aria-hidden="true" />}
                label="Snapshots"
                value="Normalized"
              />
              <SignalTile
                icon={<KeyRound className="size-5" aria-hidden="true" />}
                label="Clients"
                value="Token scoped"
              />
            </div>
          </div>
        </section>

        <aside className="flex items-center bg-surface-container px-6 py-8 sm:px-10 lg:px-12">
          <div className="w-full">
            <AuthPanel
              errorMessage={errorMessage}
              isConfigured={isConfigured}
              user={user}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}

function SignalTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="px-4 py-4">
      <div className="mb-5 flex size-11 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
        {icon}
      </div>
      <p className="md-label-large md-emphasized text-on-surface">{label}</p>
      <p className="mt-1 md-body-medium text-on-surface-variant">{value}</p>
    </div>
  );
}

function QuotaFlowVisual() {
  return (
    <div className="hidden xl:block">
      <div className="relative h-80">
        <div className="absolute left-6 top-0 h-72 w-20 rounded-full bg-primary-container" />
        <div className="absolute left-28 top-10 h-60 w-20 rounded-full bg-secondary-container" />
        <div className="absolute left-[200px] top-20 h-48 w-20 rounded-full bg-tertiary-container" />
        <div className="absolute bottom-4 left-0 right-0 rounded-[var(--md-sys-shape-corner-extra-extra-large)] bg-surface-container-low px-5 py-4">
          <div className="flex items-end gap-3">
            <span className="h-16 w-6 rounded-full bg-primary" />
            <span className="h-24 w-6 rounded-full bg-secondary" />
            <span className="h-12 w-6 rounded-full bg-tertiary" />
            <span className="h-20 w-6 rounded-full bg-primary-container" />
          </div>
          <p className="mt-4 md-label-large text-on-surface-variant">
            Provider signals converge into one relay state.
          </p>
        </div>
      </div>
    </div>
  );
}
