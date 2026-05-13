import { headers } from "next/headers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard/dashboard-shell";
import { StatusMetrics } from "@/app/components/dashboard/status-metrics";
import { SubscriptionManager } from "@/app/components/quota/subscription-manager";
import { auth, isAuthorizedUser } from "@/app/lib/auth";
import { providerDescriptors } from "@/app/lib/quota/providers";
import { listSubscriptions } from "@/app/lib/quota/store";

export const metadata: Metadata = {
  title: "Overview | QuotaHub Relay",
  description: "Provider subscription and quota snapshot overview.",
};

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
  const snapshotCount = subscriptions.filter(
    (subscription) => subscription.snapshot,
  ).length;

  return (
    <DashboardShell
      activeItem="overview"
      description="Review connected provider subscriptions at a glance, then open a subscription for model-level quota windows."
      title="Overview"
      user={user}
    >
      <div className="pt-6">
        <StatusMetrics
          metrics={[
            { label: "Providers", value: providerDescriptors.length },
            { label: "Subscriptions", value: subscriptions.length },
            { label: "Snapshots", value: snapshotCount },
          ]}
        />
      </div>

      <div className="pt-6">
        <SubscriptionManager
          initialProviders={providerDescriptors}
          initialSubscriptions={subscriptions}
        />
      </div>
    </DashboardShell>
  );
}
