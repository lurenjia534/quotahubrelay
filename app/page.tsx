import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
    <main className="flex min-h-svh flex-1 items-center justify-center bg-background p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            Q
          </div>
          <span className="text-sm font-medium text-foreground">
            QuotaHub Relay
          </span>
        </div>

        <AuthPanel
          errorMessage={errorMessage}
          isConfigured={isConfigured}
          user={user}
        />
      </div>
    </main>
  );
}
