"use client";

import { FormEvent, useState } from "react";
import { Trash2 } from "lucide-react";
import { RelayClientToken } from "@/app/lib/quota/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";

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

  async function createClientToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = clientTokenName.trim();

    if (!trimmedName) {
      setMessage("Enter a token name before creating a client token.");
      return;
    }

    setPendingAction("create");
    setMessage(null);
    setNewClientToken(null);

    const response = await fetch("/api/relay/client-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmedName }),
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
    <div className="space-y-10">
      <FieldSet className="border-t pt-6">
        <FieldLegend>Remote access</FieldLegend>
        <FieldDescription>
          Control whether generated Bearer tokens can reach relay endpoints.
        </FieldDescription>

        <FieldGroup className="gap-0">
          <Field
            orientation="responsive"
            className="border-y py-4 @md/field-group:items-center"
          >
            <FieldContent>
              <FieldLabel htmlFor="remote-client-access">
                Remote client mode
              </FieldLabel>
              <FieldDescription>
                {remoteClientAccessEnabled
                  ? "Client tokens can read relay endpoints."
                  : "Relay endpoints reject client-token requests."}
              </FieldDescription>
            </FieldContent>

            <div className="flex items-center gap-3">
              <Badge variant={remoteClientAccessEnabled ? "default" : "secondary"}>
                {remoteClientAccessEnabled ? "Enabled" : "Disabled"}
              </Badge>
              <Switch
                id="remote-client-access"
                checked={remoteClientAccessEnabled}
                disabled={pendingAction === "settings"}
                onCheckedChange={updateRemoteClientAccess}
              />
            </div>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet className="border-t pt-6">
        <FieldLegend>Client tokens</FieldLegend>
        <FieldDescription>
          Create scoped tokens for trusted Android clients. The full token is
          shown once.
        </FieldDescription>

        <form onSubmit={createClientToken} className="border-y py-4">
          <FieldGroup className="gap-3 @container/field-group sm:flex-row sm:items-end">
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="client-token-name">Token name</FieldLabel>
              <Input
                id="client-token-name"
                value={clientTokenName}
                onChange={(event) => setClientTokenName(event.target.value)}
                placeholder="Android client"
              />
            </Field>

            <Button
              type="submit"
              disabled={pendingAction === "create"}
              className="w-full sm:w-auto"
            >
              {pendingAction === "create" ? "Creating..." : "Create token"}
            </Button>
          </FieldGroup>
        </form>

        {newClientToken ? (
          <Alert className="border-amber-500/30 bg-amber-500/10">
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              Copy this token now
            </AlertTitle>
            <AlertDescription className="text-amber-900/80 dark:text-amber-100/80">
              It will not be shown again.
            </AlertDescription>
            <code className="mt-3 block break-all rounded-md bg-background px-2.5 py-2 font-mono text-xs text-foreground ring-1 ring-border">
              {newClientToken}
            </code>
          </Alert>
        ) : null}

        {message ? (
          <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          <div className="grid gap-1 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Active tokens
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Revoke tokens that no longer match a trusted device.
              </p>
            </div>
            <p className="text-sm tabular-nums text-muted-foreground">
              {clientTokens.length} total
            </p>
          </div>

          <ItemGroup className="gap-0 divide-y border-y">
            {clientTokens.length === 0 ? (
              <Item className="rounded-none border-0 px-0 py-10" role="listitem">
                <ItemContent>
                  <ItemTitle>No client tokens</ItemTitle>
                  <ItemDescription>
                    Create a token when a trusted device is ready to connect.
                  </ItemDescription>
                </ItemContent>
              </Item>
            ) : (
              clientTokens.map((token) => {
                const isRevoking = pendingAction === `delete:${token.id}`;

                return (
                  <Item
                    key={token.id}
                    className="rounded-none border-0 px-0 py-4"
                    role="listitem"
                  >
                    <ItemContent className="min-w-0">
                      <ItemTitle className="max-w-full">
                        <span className="truncate">{token.name}</span>
                        {token.lastUsedAt ? (
                          <Badge variant="outline">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Unused</Badge>
                        )}
                      </ItemTitle>
                      <ItemDescription>{formatTokenMeta(token)}</ItemDescription>
                    </ItemContent>

                    <ItemActions className="basis-full sm:basis-auto">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => revokeClientToken(token.id)}
                        disabled={isRevoking}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        {isRevoking ? "Revoking..." : "Revoke"}
                      </Button>
                    </ItemActions>
                  </Item>
                );
              })
            )}
          </ItemGroup>
        </div>
      </FieldSet>
    </div>
  );
}

function formatTokenMeta(token: RelayClientToken) {
  const parts = [
    `${token.tokenPrefix}...`,
    `Created ${new Date(token.createdAt).toLocaleString()}`,
  ];

  if (token.lastUsedAt) {
    parts.push(`Last used ${new Date(token.lastUsedAt).toLocaleString()}`);
  }

  return parts.join(" · ");
}
