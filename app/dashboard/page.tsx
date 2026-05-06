import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard/dashboard-shell";
import { SubscriptionManager } from "@/app/components/quota/subscription-manager";
import { auth, isAuthorizedUser } from "@/app/lib/auth";
import { providerDescriptors } from "@/app/lib/quota/providers";
import { listSubscriptions } from "@/app/lib/quota/store";

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

  const subscriptions = await listSubscriptions(user.id);

  return (
    <DashboardShell
      activeItem="overview"
      description="Manage provider credentials on the server and expose normalized quota snapshots for linked clients."
      title="Overview"
      user={user}
    >
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
          initialProviders={providerDescriptors}
          initialSubscriptions={subscriptions}
        />
      </div>
    </DashboardShell>
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
