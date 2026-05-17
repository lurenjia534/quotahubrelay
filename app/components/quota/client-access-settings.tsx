"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Hand,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Timer,
  Trash2,
  Wifi,
  Zap,
} from "lucide-react";
import {
  relayRefreshModeLabels,
} from "@/app/lib/quota/types";
import type {
  RelayClientToken,
  RelayRefreshMode,
} from "@/app/lib/quota/types";
import {
  MaterialAlert,
  MaterialBadge,
  MaterialButton,
  MaterialIconSurface,
  MaterialSectionHeader,
  MaterialSwitch,
  MaterialTextField,
} from "@/app/components/material/primitives";
import {
  expressiveContainer,
  expressiveItem,
  expressiveListItem,
  materialPress,
  materialRowHover,
} from "@/app/components/material/motion";
import { ThemeColorSettings } from "@/app/components/quota/theme-color-settings";

type ClientAccessSettingsProps = {
  initialClientTokens: RelayClientToken[];
  initialRemoteClientAccessEnabled: boolean;
  initialRefreshMode: RelayRefreshMode;
};

export function ClientAccessSettings({
  initialClientTokens,
  initialRemoteClientAccessEnabled,
  initialRefreshMode,
}: ClientAccessSettingsProps) {
  const [clientTokens, setClientTokens] = useState(initialClientTokens);
  const [remoteClientAccessEnabled, setRemoteClientAccessEnabled] = useState(
    initialRemoteClientAccessEnabled,
  );
  const [refreshMode, setRefreshMode] = useState(initialRefreshMode);
  const [newClientToken, setNewClientToken] = useState<string | null>(null);
  const [clientTokenName, setClientTokenName] = useState("Android client");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function updateRemoteClientAccess(enabled: boolean) {
    const previousValue = remoteClientAccessEnabled;
    setRemoteClientAccessEnabled(enabled);
    setPendingAction("settings:remote");
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

  async function updateRefreshMode(mode: RelayRefreshMode) {
    if (mode === refreshMode) return;

    const previousMode = refreshMode;
    setRefreshMode(mode);
    setPendingAction("settings:refresh");
    setMessage(null);

    const response = await fetch("/api/relay/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshMode: mode }),
    });
    const payload = await response.json();
    setPendingAction(null);

    if (!response.ok) {
      setRefreshMode(previousMode);
      setMessage(payload.error?.message ?? "Failed to update relay settings.");
      return;
    }

    setRefreshMode(payload.settings.refreshMode);
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

      <motion.section layout variants={expressiveItem}>
        <MaterialSectionHeader
          action={
            <MaterialBadge variant="primary">
              {relayRefreshModeLabels[refreshMode]}
            </MaterialBadge>
          }
          className="mb-5"
          description="Set how aggressively relay reads should refresh stale provider snapshots."
          icon={<RefreshCw className="size-6" aria-hidden="true" />}
          title="Refresh cadence"
          tone="secondary"
        />

        <div
          className="grid gap-2 border-y border-outline-variant py-4 md:grid-cols-3"
          role="radiogroup"
          aria-label="Refresh cadence"
        >
          {refreshModeOptions.map((option) => {
            const isSelected = option.id === refreshMode;
            const Icon = option.icon;

            return (
              <motion.button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={pendingAction?.startsWith("settings")}
                onClick={() => updateRefreshMode(option.id)}
                className={classNamesForRefreshModeButton(isSelected)}
                whileHover={materialRowHover}
                whileTap={materialPress}
              >
                {isSelected ? (
                  <motion.span
                    className="absolute inset-0 rounded-[inherit] bg-primary-container"
                    layoutId="refresh-mode-selected-container"
                  />
                ) : null}
                <span className="relative z-10 flex items-start gap-3">
                  <span
                    className={
                      isSelected
                        ? "grid size-11 shrink-0 place-items-center rounded-[var(--md-sys-shape-corner-large-increased)] bg-primary text-on-primary"
                        : "grid size-11 shrink-0 place-items-center rounded-[var(--md-sys-shape-corner-large)] bg-surface-container-high text-on-surface-variant"
                    }
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block md-title-small md-emphasized">
                      {option.label}
                    </span>
                    <span className="mt-1 block md-label-medium opacity-80">
                      {option.interval}
                    </span>
                    <span className="mt-3 block md-body-small opacity-80">
                      {option.description}
                    </span>
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      <motion.div
        className="grid gap-8 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
        variants={expressiveItem}
      >
      <motion.section layout>
        <MaterialSectionHeader
          action={
            <MaterialBadge
              variant={remoteClientAccessEnabled ? "success" : "outline"}
            >
              {remoteClientAccessEnabled ? "Enabled" : "Disabled"}
            </MaterialBadge>
          }
          className="mb-5"
          description="Control whether Bearer tokens can reach relay endpoints."
          icon={<Wifi className="size-6" aria-hidden="true" />}
          title="Remote access"
        />

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
              disabled={pendingAction === "settings:remote"}
              onCheckedChange={updateRemoteClientAccess}
            />
          </div>
        </div>
      </motion.section>

      <motion.section className="xl:border-l xl:border-outline-variant xl:pl-8" layout>
        <MaterialSectionHeader
          className="mb-5"
          description="Create scoped tokens for trusted Android clients."
          icon={<KeyRound className="size-6" aria-hidden="true" />}
          title="Client tokens"
          tone="tertiary"
        />

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
              <MaterialIconSurface
                className="mx-auto mb-4"
                size="lg"
                tone="secondary"
              >
                <ShieldCheck className="size-6" aria-hidden="true" />
              </MaterialIconSurface>
              <h4 className="md-title-large md-emphasized text-on-surface">
                No client tokens
              </h4>
              <p className="mx-auto mt-2 max-w-md md-body-medium text-on-surface-variant">
                Create a token when a trusted device is ready to connect.
              </p>
            </motion.div>
            ) : (
            <motion.div className="grid gap-2" layout>
              {clientTokens.map((token) => {
                const isRevoking = pendingAction === `delete:${token.id}`;

                return (
                  <motion.div
                    key={token.id}
                    layout
                    className="md-expressive-surface grid gap-4 bg-surface-container-low px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    variants={expressiveListItem}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    whileHover={materialRowHover}
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

const refreshModeOptions = [
  {
    id: "realtime",
    label: "Realtime",
    interval: "Every minute",
    description: "Refreshes due snapshots when relay reads are older than 60 seconds.",
    icon: Zap,
  },
  {
    id: "balanced",
    label: "Balanced",
    interval: "Every hour",
    description: "Keeps provider calls lower while updating stale snapshots hourly.",
    icon: Timer,
  },
  {
    id: "manual",
    label: "Manual",
    interval: "Manual only",
    description: "Updates only through the explicit subscription refresh action.",
    icon: Hand,
  },
] satisfies {
  id: RelayRefreshMode;
  label: string;
  interval: string;
  description: string;
  icon: typeof Zap;
}[];

function classNamesForRefreshModeButton(isSelected: boolean) {
  const baseClassName =
    "md-state-layer md-expressive-surface relative min-h-32 overflow-hidden px-4 py-4 text-left transition-[background-color,border-radius,color,transform] duration-300 ease-[var(--md-sys-motion-easing-standard)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25 disabled:pointer-events-none disabled:opacity-45";

  return isSelected
    ? `${baseClassName} text-on-primary-container`
    : `${baseClassName} bg-surface-container-low text-on-surface hover:bg-surface-container`;
}
