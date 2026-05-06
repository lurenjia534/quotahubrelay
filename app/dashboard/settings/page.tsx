import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard/dashboard-shell";
import { ClientAccessSettings } from "@/app/components/quota/client-access-settings";
import { auth, isAuthorizedUser } from "@/app/lib/auth";
import { listClientTokens } from "@/app/lib/quota/store";

export default async function DashboardSettingsPage() {
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

  const clientTokens = await listClientTokens(user.id);

  return (
    <DashboardShell
      activeItem="settings"
      description="Manage relay client access and server coordination settings."
      title="Settings"
      user={user}
    >
      <div className="grid gap-4 border-b border-zinc-200 py-6 dark:border-zinc-800 sm:grid-cols-3">
        <StatusMetric label="Client tokens" value={clientTokens.length} />
        <StatusMetric
          label="Active devices"
          value={clientTokens.filter((token) => token.lastUsedAt).length}
        />
        <StatusMetric label="Access mode" value="Bearer" />
      </div>

      <div className="py-8">
        <ClientAccessSettings initialClientTokens={clientTokens} />
      </div>
    </DashboardShell>
  );
}

function StatusMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
