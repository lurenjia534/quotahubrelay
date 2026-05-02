import { headers } from "next/headers";
import { auth, isAuthConfigured } from "@/app/lib/auth";
import { SignInWithGithub } from "@/app/sign-in-with-github";
import { SignOutButton } from "@/app/sign-out-button";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  auth_not_configured:
    "GitHub SSO is not configured. Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and AUTH_SECRET.",
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

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-white dark:bg-black">
      <div className="w-full max-w-sm px-4">
        <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <h1 className="text-xl font-medium text-black dark:text-white">
            {user ? "Signed in" : "Sign in"}
          </h1>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            {user
              ? "Your GitHub account is connected"
              : "Sign in with your GitHub account"}
          </p>
        </div>

        <div className="border-t border-zinc-200 py-6 dark:border-zinc-800">
          {!isConfigured || error ? (
            <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300">
              {!isConfigured ? errorMessages.auth_not_configured : errorMessage}
            </p>
          ) : null}

          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.image ?? ""}
                  alt=""
                  className="h-10 w-10 rounded-full"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {user.email}
                  </p>
                </div>
              </div>

              <SignOutButton />
            </div>
          ) : (
            <SignInWithGithub disabled={!isConfigured} />
          )}
        </div>

        <p className="border-t border-zinc-200 pt-4 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
          &copy; {new Date().getFullYear()} QuotaHub Relay
        </p>
      </div>
    </div>
  );
}
