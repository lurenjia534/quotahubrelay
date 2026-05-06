import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, isAuthorizedUser } from "@/app/lib/auth";
import { providerDescriptors } from "@/app/lib/quota/providers";
import { listClientTokens, listSubscriptions } from "@/app/lib/quota/store";
import { SignOutButton } from "@/app/components/auth/sign-out-button";
import { SubscriptionManager } from "@/app/components/quota/subscription-manager";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session?.user;

  if (!user) {
    redirect("/");
  }

  if (!isAuthorizedUser(user)) {
    redirect("/?error=access_denied");
  }

  const [subscriptions, clientTokens] = await Promise.all([
    listSubscriptions(user.id),
    listClientTokens(user.id),
  ]);

  return (
    <div className="min-h-full flex-1 bg-white dark:bg-black">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {user.email}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-black dark:text-white">
              QuotaHub Relay
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
              Manage provider credentials on the server and expose normalized
              quota snapshots for linked clients.
            </p>
          </div>
          <div className="w-full sm:w-40">
            <SignOutButton />
          </div>
        </div>

        <div className="grid gap-4 border-b border-zinc-200 py-6 dark:border-zinc-800 sm:grid-cols-3">
          <StatusMetric label="Providers" value={providerDescriptors.length} />
          <StatusMetric label="Subscriptions" value={subscriptions.length} />
          <StatusMetric
            label="Snapshots"
            value={subscriptions.filter((subscription) => subscription.snapshot).length}
          />
        </div>

        <div className="py-8">
          <SubscriptionManager
            initialClientTokens={clientTokens}
            initialProviders={providerDescriptors}
            initialSubscriptions={subscriptions}
          />
        </div>
      </main>
    </div>
  );
}

function StatusMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
