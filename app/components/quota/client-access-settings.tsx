"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { KeyRound, ShieldCheck, Trash2, Wifi } from "lucide-react";
import { RelayClientToken } from "@/app/lib/quota/types";
import {
  MaterialAlert,
  MaterialBadge,
  MaterialButton,
  MaterialSwitch,
  MaterialTextField,
} from "@/app/components/material/primitives";
import {
  expressiveContainer,
  expressiveItem,
  expressiveListItem,
  materialHover,
} from "@/app/components/material/motion";
import { ThemeColorSettings } from "@/app/components/quota/theme-color-settings";

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
    <motion.div
      animate="show"
      className="space-y-10"
      initial="hidden"
      variants={expressiveContainer}
    >
      <ThemeColorSettings />

      <motion.div
        className="grid gap-8 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
        variants={expressiveItem}
      >
      <motion.section layout>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-[var(--md-sys-shape-corner-large)] bg-primary-container text-on-primary-container">
              <Wifi className="size-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="md-headline-small md-emphasized text-on-surface">
                Remote access
              </h2>
              <p className="mt-1 md-body-medium text-on-surface-variant">
                Control whether Bearer tokens can reach relay endpoints.
              </p>
            </div>
          </div>
          <MaterialBadge
            variant={remoteClientAccessEnabled ? "success" : "outline"}
          >
            {remoteClientAccessEnabled ? "Enabled" : "Disabled"}
          </MaterialBadge>
        </div>

        <div className="border-y border-outline-variant py-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <label
                htmlFor="remote-client-access"
                className="md-title-small md-emphasized text-on-surface"
              >
                Remote client mode
              </label>
              <p className="mt-1 md-body-medium text-on-surface-variant">
                {remoteClientAccessEnabled
                  ? "Client tokens can read relay endpoints."
                  : "Relay endpoints reject client-token requests."}
              </p>
            </div>

            <MaterialSwitch
              id="remote-client-access"
              checked={remoteClientAccessEnabled}
              disabled={pendingAction === "settings"}
              onCheckedChange={updateRemoteClientAccess}
            />
          </div>
        </div>
      </motion.section>

      <motion.section className="xl:border-l xl:border-outline-variant xl:pl-8" layout>
        <div className="mb-5 flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-[var(--md-sys-shape-corner-large)] bg-tertiary-container text-on-tertiary-container">
            <KeyRound className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="md-headline-small md-emphasized text-on-surface">
              Client tokens
            </h2>
            <p className="mt-1 md-body-medium text-on-surface-variant">
              Create scoped tokens for trusted Android clients.
            </p>
          </div>
        </div>

        <form
          onSubmit={createClientToken}
          className="grid gap-3 border-b border-outline-variant pb-5 sm:grid-cols-[1fr_auto] sm:items-end"
        >
          <MaterialTextField
            label="Token name"
            value={clientTokenName}
            onChange={(event) => setClientTokenName(event.target.value)}
            placeholder="Android client"
          />

          <MaterialButton
            type="submit"
            size="lg"
            disabled={pendingAction === "create"}
            className="w-full sm:w-auto"
          >
            <KeyRound className="size-5" aria-hidden="true" />
            {pendingAction === "create" ? "Creating..." : "Create token"}
          </MaterialButton>
        </form>

        <div className="mt-5 space-y-4">
          <AnimatePresence mode="popLayout">
            {newClientToken ? (
              <motion.div
                key="new-client-token"
                layout
                variants={expressiveListItem}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <MaterialAlert title="Copy this token now" variant="warning">
                  <p>It will not be shown again.</p>
                  <code className="mt-3 block break-all rounded-[var(--md-sys-shape-corner-medium)] bg-surface px-3 py-2 font-mono text-xs text-on-surface ring-1 ring-outline-variant">
                    {newClientToken}
                  </code>
                </MaterialAlert>
              </motion.div>
            ) : null}

            {message ? (
              <motion.div
                key={message}
                layout
                variants={expressiveListItem}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <MaterialAlert variant={isErrorMessage(message) ? "error" : "info"}>
                  {message}
                </MaterialAlert>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <motion.div className="mt-6" layout>
          <div className="grid gap-1 border-b border-outline-variant pb-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <h3 className="md-title-large md-emphasized text-on-surface">
                Active tokens
              </h3>
              <p className="mt-1 md-body-medium text-on-surface-variant">
                Revoke tokens that no longer match a trusted device.
              </p>
            </div>
            <p className="md-label-large tabular-nums text-on-surface-variant">
              {clientTokens.length} total
            </p>
          </div>

          <AnimatePresence initial={false} mode="popLayout">
            {clientTokens.length === 0 ? (
            <motion.div
              key="empty-client-tokens"
              layout
              className="py-12 text-center"
              variants={expressiveListItem}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                <ShieldCheck className="size-6" aria-hidden="true" />
              </div>
              <h4 className="md-title-large md-emphasized text-on-surface">
                No client tokens
              </h4>
              <p className="mx-auto mt-2 max-w-md md-body-medium text-on-surface-variant">
                Create a token when a trusted device is ready to connect.
              </p>
            </motion.div>
            ) : (
            <motion.div className="divide-y divide-outline-variant" layout>
              {clientTokens.map((token) => {
                const isRevoking = pendingAction === `delete:${token.id}`;

                return (
                  <motion.div
                    key={token.id}
                    layout
                    className="grid gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    variants={expressiveListItem}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    whileHover={materialHover}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate md-title-small md-emphasized text-on-surface">
                          {token.name}
                        </h4>
                        {token.lastUsedAt ? (
                          <MaterialBadge variant="success">Active</MaterialBadge>
                        ) : (
                          <MaterialBadge variant="secondary">Unused</MaterialBadge>
                        )}
                      </div>
                      <p className="mt-1 md-body-medium text-on-surface-variant">
                        {formatTokenMeta(token)}
                      </p>
                    </div>

                    <MaterialButton
                      variant="danger"
                      size="sm"
                      onClick={() => revokeClientToken(token.id)}
                      disabled={isRevoking}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      {isRevoking ? "Revoking..." : "Revoke"}
                    </MaterialButton>
                  </motion.div>
                );
              })}
            </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.section>
      </motion.div>
    </motion.div>
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

function isErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("failed") ||
    normalized.includes("error") ||
    normalized.includes("invalid")
  );
}
