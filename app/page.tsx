import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Activity, KeyRound, RadioTower, Route } from "lucide-react";
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
    <main className="min-h-svh flex-1 bg-surface text-on-surface">
      <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_440px] xl:grid-cols-[minmax(0,1fr)_480px]">
        <section className="relative flex min-h-[68svh] flex-col overflow-hidden bg-background px-6 py-6 sm:px-10 lg:min-h-svh lg:px-14">
          <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,var(--md-sys-color-primary)_0_42%,var(--md-sys-color-secondary)_42%_72%,var(--md-sys-color-tertiary)_72%_100%)]" />

          <header className="expressive-enter flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-[var(--md-sys-shape-corner-large-increased)] bg-primary text-2xl font-bold text-on-primary">
                Q
              </span>
              <div>
                <p className="md-title-large md-emphasized">QuotaHub Relay</p>
                <p className="md-body-medium text-on-surface-variant">
                  Server quota relay
                </p>
              </div>
            </div>
            <span className="hidden rounded-full bg-secondary-container px-4 py-2 md-label-large md-emphasized text-on-secondary-container sm:inline-flex">
              Private console
            </span>
          </header>

          <div className="grid flex-1 items-center gap-10 py-12 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)]">
            <div className="expressive-enter max-w-3xl">
              <p className="mb-5 inline-flex rounded-full bg-tertiary-container px-4 py-2 md-label-large md-emphasized text-on-tertiary-container">
                Quotas normalized at the relay
              </p>
              <h1 className="md-display-medium max-w-4xl text-on-surface lg:md-display-large">
                One server view before every client request.
              </h1>
              <p className="mt-6 max-w-2xl md-body-large text-on-surface-variant">
                Provider credentials stay server-side. Clients receive only the
                quota state they are allowed to read.
              </p>
            </div>

            <RelayMap />
          </div>

          <div className="expressive-enter-delayed grid divide-y divide-outline-variant overflow-hidden border-y border-outline-variant sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <SignalCell
              icon={<RadioTower className="size-5" aria-hidden="true" />}
              label="Relay"
              value="Server held"
            />
            <SignalCell
              icon={<Activity className="size-5" aria-hidden="true" />}
              label="Snapshots"
              value="Normalized"
            />
            <SignalCell
              icon={<KeyRound className="size-5" aria-hidden="true" />}
              label="Clients"
              value="Token scoped"
            />
          </div>
        </section>

        <aside className="flex items-center border-t border-outline-variant bg-surface-container px-6 py-8 sm:px-10 lg:border-l lg:border-t-0 lg:px-10 xl:px-12">
          <AuthPanel
            errorMessage={errorMessage}
            isConfigured={isConfigured}
            user={user}
          />
        </aside>
      </div>
    </main>
  );
}

function RelayMap() {
  const rows = [
    {
      label: "OpenAI Codex",
      value: "64%",
      width: "64%",
      tone: "bg-primary",
    },
    {
      label: "Kimi Coding",
      value: "42%",
      width: "42%",
      tone: "bg-secondary",
    },
    {
      label: "MiniMax Plan",
      value: "78%",
      width: "78%",
      tone: "bg-tertiary",
    },
  ];

  return (
    <div className="expressive-enter-delayed hidden xl:block">
      <div className="relative min-h-[420px]">
        <div className="absolute left-0 top-5 h-[22rem] w-28 rounded-full bg-primary-container" />
        <div className="absolute left-[4.5rem] top-20 h-72 w-28 rounded-full bg-secondary-container" />
        <div className="absolute left-36 top-36 h-56 w-28 rounded-full bg-tertiary-container" />

        <div className="absolute bottom-0 left-14 right-0 overflow-hidden rounded-[var(--md-sys-shape-corner-extra-extra-large)] bg-surface-container-low">
          <div className="flex items-center gap-3 border-b border-outline-variant px-5 py-4">
            <span className="grid size-11 place-items-center rounded-full bg-primary text-on-primary">
              <Route className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="md-title-small md-emphasized">Relay snapshot</p>
              <p className="md-body-small text-on-surface-variant">
                Provider signals, reduced to client-safe state.
              </p>
            </div>
          </div>
          <div className="divide-y divide-outline-variant">
            {rows.map((row) => (
              <div key={row.label} className="px-5 py-4">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="md-label-large md-emphasized">{row.label}</p>
                  <p className="md-label-large text-on-surface-variant">
                    {row.value}
                  </p>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-surface-container-highest">
                  <div
                    className={`h-full rounded-full ${row.tone}`}
                    style={{ width: row.width }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalCell({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary-container text-on-secondary-container">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block md-label-large md-emphasized">{label}</span>
        <span className="block md-body-small text-on-surface-variant">
          {value}
        </span>
      </span>
    </div>
  );
}
