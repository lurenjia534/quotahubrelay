import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard/dashboard-shell";
import { SubscriptionDetail } from "@/app/components/quota/subscription-detail";
import { auth, isAuthorizedUser } from "@/app/lib/auth";
import { getSubscription } from "@/app/lib/quota/store";

export const metadata: Metadata = {
  title: "Subscription Detail | QuotaHub Relay",
  description: "Detailed provider quota windows and subscription controls.",
};

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ subscriptionId: string }>;
}) {
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

  const { subscriptionId } = await params;
  const subscription = await getSubscription(user.id, subscriptionId);

  if (!subscription) {
    notFound();
  }

  return (
    <DashboardShell
      activeItem="overview"
      description="Inspect the quota windows for one provider subscription and refresh the snapshot when needed."
      title="Subscription detail"
      user={user}
    >
      <div className="pt-6">
        <SubscriptionDetail initialSubscription={subscription} />
      </div>
    </DashboardShell>
  );
}
