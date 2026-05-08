"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RelayClientToken } from "@/app/lib/quota/types";

type ClientAccessSettingsProps = {
  initialClientTokens: RelayClientToken[];
  initialRemoteClientAccessEnabled: boolean;
};

export function ClientAccessSettings({
  initialClientTokens,
  initialRemoteClientAccessEnabled,
}: ClientAccessSettingsProps) {
  const [clientTokens, setClientTokens] = useState(initialClientTokens);
  const [remoteClientAccessEnabled, setRemoteClientAccessEnabled] = useState(
    initialRemoteClientAccessEnabled,
  );
  const [newClientToken, setNewClientToken] = useState<string | null>(null);
  const [clientTokenName, setClientTokenName] = useState("Android client");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function updateRemoteClientAccess(enabled: boolean) {
    const previousValue = remoteClientAccessEnabled;
    setRemoteClientAccessEnabled(enabled);
    setPendingAction("settings");
    setMessage(null);

    const response = await fetch("/api/relay/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remoteClientAccessEnabled: enabled }),
    });
    const payload = await response.json();
    setPendingAction(null);

    if (!response.ok) {
      setRemoteClientAccessEnabled(previousValue);
      setMessage(payload.error?.message ?? "Failed to update relay settings.");
      return;
    }

    setRemoteClientAccessEnabled(payload.settings.remoteClientAccessEnabled);
  }

  async function createClientToken() {
    setPendingAction("create");
    setMessage(null);
    setNewClientToken(null);

    const response = await fetch("/api/relay/client-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: clientTokenName }),
    });
    const payload = await response.json();
    setPendingAction(null);

    if (!response.ok) {
      setMessage(payload.error?.message ?? "Failed to create client token.");
      return;
    }

    setClientTokens((current) => [payload.clientToken, ...current]);
    setNewClientToken(payload.token);
  }

  async function revokeClientToken(tokenId: string) {
    setPendingAction(`delete:${tokenId}`);
    setMessage(null);

    const response = await fetch(`/api/relay/client-tokens/${tokenId}`, {
      method: "DELETE",
    });
    setPendingAction(null);

    if (!response.ok) {
      const payload = await response.json();
      setMessage(payload.error?.message ?? "Failed to revoke client token.");
      return;
    }

    setClientTokens((current) => current.filter((token) => token.id !== tokenId));
  }

  return (
    <div className="space-y-8">
      <section className="border-t pt-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="max-w-2xl">
            <h2 className="text-base font-medium text-foreground">
              Server coordination
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gate remote client access before this server accepts Bearer-token
              relay requests.
            </p>
          </div>

          <div className="flex items-start gap-3 justify-self-start lg:justify-self-end">
            <Switch
              checked={remoteClientAccessEnabled}
              disabled={pendingAction === "settings"}
              onCheckedChange={updateRemoteClientAccess}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                Remote client mode
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Allow trusted QuotaHub Android clients to link to this web server
                after strict authentication.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 border-y py-4">
          <p className="text-sm font-medium text-foreground">
            {remoteClientAccessEnabled
              ? "Client endpoints armed"
              : "Web dashboard only"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {remoteClientAccessEnabled
              ? "Bearer-token relay endpoints are available to generated client tokens."
              : "Bearer-token relay endpoints are closed. QuotaHub Relay still works as a web dashboard."}
          </p>
        </div>
      </section>

      <section className="border-t pt-6">
        <h2 className="text-base font-medium text-foreground">
          Android client access
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate a Bearer token for QuotaHub Android remote client mode.
          Tokens can read relay endpoints only when remote client mode is on.
        </p>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-token-name">Token name</Label>
            <Input
              id="client-token-name"
              value={clientTokenName}
              onChange={(event) => setClientTokenName(event.target.value)}
            />
          </div>

          <Button
            disabled={pendingAction === "create"}
            onClick={createClientToken}
            className="w-full"
          >
            {pendingAction === "create" ? "Creating..." : "Create client token"}
          </Button>
        </div>

        {newClientToken ? (
          <Alert className="mt-5 border-amber-500/30 bg-amber-500/10">
            <AlertTitle className="text-amber-900">
              Copy this token now. It will not be shown again.
            </AlertTitle>
            <code className="mt-2 block break-all text-xs text-amber-900 dark:text-amber-200">
              {newClientToken}
            </code>
          </Alert>
        ) : null}

        {message ? (
          <Alert className="mt-4">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
      </section>

      <section className="border-t pt-6">
        <div>
          <h2 className="text-base font-medium text-foreground">
            Active client tokens
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Revoke a token when a device is lost or no longer trusted.
          </p>
        </div>

        <div className="mt-5 divide-y border-y">
          {clientTokens.length === 0 ? (
            <p className="py-10 text-sm text-muted-foreground">
              No Android client tokens yet.
            </p>
          ) : (
            clientTokens.map((token) => (
              <div
                key={token.id}
                className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-start"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {token.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {token.tokenPrefix}... · created{" "}
                    {new Date(token.createdAt).toLocaleString()}
                    {token.lastUsedAt
                      ? ` · last used ${new Date(token.lastUsedAt).toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => revokeClientToken(token.id)}
                  disabled={pendingAction === `delete:${token.id}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {pendingAction === `delete:${token.id}` ? "Revoking..." : "Revoke"}
                </Button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
