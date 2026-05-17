import { headers } from "next/headers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard/dashboard-shell";
import { StatusMetrics } from "@/app/components/dashboard/status-metrics";
import { ClientAccessSettings } from "@/app/components/quota/client-access-settings";
import { auth, isAuthorizedUser } from "@/app/lib/auth";
import {
  getRelaySettings,
  listClientTokens,
} from "@/app/lib/quota/store";
import { relayRefreshModeLabels } from "@/app/lib/quota/types";

export const metadata: Metadata = {
  title: "Settings | QuotaHub Relay",
  description: "Relay client access, token, and theme settings.",
};

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
  const relaySettings = await getRelaySettings(user.id);

  return (
    <DashboardShell
      activeItem="settings"
      description="Manage relay client access and server coordination settings."
      title="Settings"
      user={user}
    >
      <div className="pt-6">
        <StatusMetrics
          metrics={[
            { label: "Client tokens", value: clientTokens.length },
            {
              label: "Remote client",
              value: relaySettings.remoteClientAccessEnabled ? "On" : "Off",
            },
            {
              label: "Refresh",
              value: relayRefreshModeLabels[relaySettings.refreshMode],
            },
          ]}
        />
      </div>

      <div className="pt-6">
        <ClientAccessSettings
          initialClientTokens={clientTokens}
          initialRemoteClientAccessEnabled={
            relaySettings.remoteClientAccessEnabled
          }
          initialRefreshMode={relaySettings.refreshMode}
        />
      </div>
    </DashboardShell>
  );
}
