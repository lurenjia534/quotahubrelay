import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, isAuthConfigured, isAuthorizedUser } from "@/app/lib/auth";
import { SignInWithGithub } from "@/app/components/auth/sign-in-with-github";
import { SignOutButton } from "@/app/components/auth/sign-out-button";
import { UserSummary } from "@/app/components/auth/user-summary";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

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
  const errorMessage = error
    ? (errorMessages[error] ?? "Unable to sign in. Please try again.")
    : null;
  const isConfigured = isAuthConfigured();
  const isAuthorized = isAuthorizedUser(user);

  if (user && isAuthorized) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm px-4">
        <div className="pb-6">
          <p className="text-sm font-medium text-muted-foreground">
            QuotaHub Relay
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {user ? (isAuthorized ? "Signed in" : "Access denied") : "Sign in"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user && isAuthorized
              ? "Your GitHub account is connected"
              : user
                ? "This GitHub account is not allowed"
              : "Sign in with your GitHub account"}
          </p>
        </div>

        <Separator />

        <div className="py-6">
          {!isConfigured || error || (user && !isAuthorized) ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {!isConfigured
                  ? errorMessages.auth_not_configured
                  : user && !isAuthorized
                    ? errorMessages.access_denied
                    : errorMessage}
              </AlertDescription>
            </Alert>
          ) : null}

          {user ? (
            <div className="space-y-4">
              <UserSummary
                email={user.email}
                image={user.image}
                name={user.name}
              />
              <SignOutButton />
            </div>
          ) : (
            <SignInWithGithub disabled={!isConfigured} />
          )}
        </div>

        <Separator />

        <p className="pt-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} QuotaHub Relay
        </p>
      </div>
    </div>
  );
}
