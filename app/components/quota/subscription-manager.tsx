"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  Database,
  Layers3,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  ProviderDescriptor,
  QuotaResource,
  QuotaSubscription,
  QuotaWindow,
} from "@/app/lib/quota/types";
import {
  MaterialAlert,
  MaterialBadge,
  MaterialButton,
  MaterialIconSurface,
  MaterialLinearProgressIndicator,
  MaterialSectionHeader,
  MaterialTextField,
} from "@/app/components/material/primitives";
import {
  expressiveContainer,
  expressiveItem,
  expressiveListItem,
  materialHover,
  materialQuickSpring,
  materialTap,
} from "@/app/components/material/motion";
import { cn } from "@/lib/utils";

type SubscriptionManagerProps = {
  initialProviders: ProviderDescriptor[];
  initialSubscriptions: QuotaSubscription[];
};

export function SubscriptionManager({
  initialProviders,
  initialSubscriptions,
}: SubscriptionManagerProps) {
  const [providers] = useState(initialProviders);
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [selectedProviderId, setSelectedProviderId] = useState(
    initialProviders[0]?.id ?? "",
  );
  const [customTitle, setCustomTitle] = useState("");
  const [credentialValues, setCredentialValues] = useState<Record<string, string>>(
    {},
  );
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === selectedProviderId),
    [providers, selectedProviderId],
  );

  async function createSubscription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProvider) return;

    setPendingAction("create");
    setMessage(null);
    const response = await fetch("/api/relay/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: selectedProvider.id,
        customTitle,
        credentials: { values: credentialValues },
      }),
    });
    const payload = await response.json();
    setPendingAction(null);

    if (!response.ok) {
      setMessage(payload.error?.message ?? "Failed to create subscription.");
      return;
    }

    setSubscriptions((current) => [payload.subscription, ...current]);
    setCustomTitle("");
    setCredentialValues({});
    setMessage("Subscription connected.");
  }

  async function refreshSubscription(subscriptionId: string) {
    setPendingAction(`refresh:${subscriptionId}`);
    setMessage(null);
    const response = await fetch(
      `/api/relay/subscriptions/${subscriptionId}/refresh`,
      { method: "POST" },
    );
    const payload = await response.json();
    setPendingAction(null);

    if (!response.ok) {
      setMessage(payload.error?.message ?? "Refresh failed.");
      return;
    }

    setSubscriptions((current) =>
      current.map((subscription) =>
        subscription.id === subscriptionId ? payload.subscription : subscription,
      ),
    );
  }

  async function deleteSubscription(subscriptionId: string) {
    setPendingAction(`delete:${subscriptionId}`);
    setMessage(null);
    const response = await fetch(`/api/relay/subscriptions/${subscriptionId}`, {
      method: "DELETE",
    });
    setPendingAction(null);

    if (!response.ok) {
      const payload = await response.json();
      setMessage(payload.error?.message ?? "Delete failed.");
      return;
    }

    setSubscriptions((current) =>
      current.filter((subscription) => subscription.id !== subscriptionId),
    );
  }

  return (
    <motion.div
      animate="show"
      className="space-y-6"
      initial="hidden"
      variants={expressiveContainer}
    >
      <AnimatePresence mode="popLayout">
        {message ? (
          <motion.div
            key={message}
            layout
            variants={expressiveListItem}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <MaterialAlert
              variant={
                message.toLowerCase().includes("failed") ? "error" : "success"
              }
            >
              {message}
            </MaterialAlert>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]"
        variants={expressiveItem}
      >
        <section className="min-w-0">
          <MaterialSectionHeader
            action={
              <MaterialBadge variant="primary">
                {subscriptions.length} total
              </MaterialBadge>
            }
            className="border-b border-outline-variant pb-5"
            description={`${subscriptions.length} connected provider${
              subscriptions.length === 1 ? "" : "s"
            } with quota snapshots.`}
            icon={<Database className="size-6" aria-hidden="true" />}
            title="Server subscriptions"
          />

          <div className="divide-y divide-outline-variant">
            <AnimatePresence initial={false} mode="popLayout">
            {subscriptions.length === 0 ? (
              <motion.div
                key="empty-subscriptions"
                layout
                className="py-14 text-center"
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
                  <Layers3 className="size-6" aria-hidden="true" />
                </MaterialIconSurface>
                <h3 className="md-title-large md-emphasized text-on-surface">
                  No subscriptions connected
                </h3>
                <p className="mx-auto mt-2 max-w-md md-body-medium text-on-surface-variant">
                  Add a provider to collect quota snapshots for remote clients.
                </p>
              </motion.div>
            ) : (
              subscriptions.map((subscription) => (
                <SubscriptionItem
                  key={subscription.id}
                  pendingAction={pendingAction}
                  subscription={subscription}
                  onDelete={deleteSubscription}
                  onRefresh={refreshSubscription}
                />
              ))
            )}
            </AnimatePresence>
          </div>
        </section>

        <motion.aside
          className="xl:sticky xl:top-28 xl:self-start xl:border-l xl:border-outline-variant xl:pl-8"
          layout
        >
          <MaterialSectionHeader
            className="mb-5"
            description="Credentials stay encrypted on this server."
            icon={<Plus className="size-6" aria-hidden="true" />}
            title="Connect provider"
            tone="tertiary"
          />

          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <p className="md-label-large md-emphasized text-on-surface">
                Provider
              </p>
              <p className="md-label-medium text-on-surface-variant">
                {providers.length} available
              </p>
            </div>
            <div className="grid gap-2">
              {providers.map((provider) => {
                const isSelected = provider.id === selectedProviderId;
                const requiredCount = provider.credentialFields.filter(
                  (field) => field.isRequired,
                ).length;

                return (
                  <motion.button
                    key={provider.id}
                    type="button"
                    layout
                    whileHover={materialHover}
                    whileTap={materialTap}
                    onClick={() => {
                      setSelectedProviderId(provider.id);
                      setCredentialValues({});
                    }}
                    aria-pressed={isSelected}
                    className={cn(
                      "md-state-layer md-expressive-surface flex min-h-16 w-full items-center gap-3 px-3 text-left",
                      "transition-[background-color,border-radius,color,font-variation-settings,transform] duration-300 ease-[var(--md-sys-motion-easing-standard)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25",
                      isSelected
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-surface-container-low text-on-surface",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-11 shrink-0 place-items-center rounded-full md-label-large md-emphasized",
                        isSelected
                          ? "bg-primary text-on-primary"
                          : "bg-surface text-on-surface-variant",
                      )}
                      aria-hidden="true"
                    >
                      {providerInitials(provider.displayName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate md-title-small md-emphasized">
                        {provider.displayName}
                      </span>
                      <span className="block md-body-small opacity-80">
                        {requiredCount === 0
                          ? "No credentials required"
                          : `${requiredCount} credential${requiredCount === 1 ? "" : "s"} required`}
                      </span>
                    </span>
                    {isSelected ? (
                      <Check className="size-5 shrink-0" aria-hidden="true" />
                    ) : null}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {selectedProvider ? (
            <motion.form
              key={selectedProvider.id}
              layout
              onSubmit={createSubscription}
              className="mt-6 space-y-4"
              variants={expressiveListItem}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <MaterialTextField
                label="Display name"
                value={customTitle}
                onChange={(event) => setCustomTitle(event.target.value)}
                placeholder={selectedProvider.displayName}
              />

              {selectedProvider.credentialFields.map((field) => (
                <MaterialTextField
                  key={field.key}
                  label={field.label}
                  type={field.isSecret ? "password" : "text"}
                  required={field.isRequired}
                  value={credentialValues[field.key] ?? ""}
                  onChange={(event) =>
                    setCredentialValues((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                />
              ))}

              <MaterialButton
                type="submit"
                size="lg"
                className="w-full"
                disabled={pendingAction === "create"}
              >
                <Plus className="size-5" aria-hidden="true" />
                {pendingAction === "create" ? "Connecting..." : "Connect provider"}
              </MaterialButton>
            </motion.form>
            ) : (
            <motion.div
              key="no-provider"
              layout
              className="mt-6 border-t border-outline-variant py-6 text-center"
              variants={expressiveListItem}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <p className="md-body-medium text-on-surface-variant">
                Select a provider to enter credentials.
              </p>
            </motion.div>
            )}
          </AnimatePresence>
        </motion.aside>
      </motion.div>
    </motion.div>
  );
}

function SubscriptionItem({
  pendingAction,
  subscription,
  onDelete,
  onRefresh,
}: {
  pendingAction: string | null;
  subscription: QuotaSubscription;
  onDelete: (subscriptionId: string) => void;
  onRefresh: (subscriptionId: string) => void;
}) {
  const resources = subscription.snapshot?.resources ?? [];

  return (
    <motion.article
      layout
      className="py-6"
      variants={expressiveListItem}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 truncate md-title-large md-emphasized text-on-surface">
              {subscription.displayTitle}
            </h3>
            <StatusBadge state={subscription.syncState} />
          </div>
          <p className="mt-1 md-body-medium text-on-surface-variant">
            {subscription.providerDisplayName}
            {subscription.lastSyncedAt
              ? ` · synced ${formatDateTime(subscription.lastSyncedAt)}`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <MaterialButton
            variant="outlined"
            size="sm"
            onClick={() => onRefresh(subscription.id)}
            disabled={pendingAction === `refresh:${subscription.id}`}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            {pendingAction === `refresh:${subscription.id}` ? "Refreshing" : "Refresh"}
          </MaterialButton>
          <MaterialButton
            variant="danger"
            size="sm"
            onClick={() => onDelete(subscription.id)}
            disabled={pendingAction === `delete:${subscription.id}`}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {pendingAction === `delete:${subscription.id}` ? "Deleting" : "Delete"}
          </MaterialButton>
        </div>
      </div>

      {resources.length > 0 ? (
        <motion.div
          layout
          className="mt-5 divide-y divide-outline-variant overflow-hidden rounded-[var(--md-sys-shape-corner-extra-large-increased)] bg-surface-container-low"
        >
          {resources.map((resource) => (
            <ResourceUsage key={resource.key} resource={resource} />
          ))}
        </motion.div>
      ) : (
        <motion.p
          layout
          className="md-expressive-surface mt-5 border-l-4 border-outline-variant bg-surface-container-low px-4 py-3 md-body-medium text-on-surface-variant"
          transition={materialQuickSpring}
        >
          No quota snapshot is available yet. Refresh this subscription to fetch
          the latest provider state.
        </motion.p>
      )}
    </motion.article>
  );
}

function ResourceUsage({ resource }: { resource: QuotaResource }) {
  return (
    <motion.div
      layout
      className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(160px,240px)_1fr]"
    >
      <div className="min-w-0">
        <h4 className="truncate md-title-small md-emphasized text-on-surface">
          {resource.title}
        </h4>
        <p className="mt-1 md-body-small text-on-surface-variant">
          {resource.type}
          {resource.role ? ` · ${resource.role.toLowerCase()}` : ""}
        </p>
      </div>

      <div className="space-y-4">
        {resource.windows.map((window) => (
          <QuotaWindowUsage
            key={`${resource.key}:${window.windowKey}`}
            window={window}
          />
        ))}
      </div>
    </motion.div>
  );
}

function QuotaWindowUsage({ window }: { window: QuotaWindow }) {
  const usage = quotaUsage(window);
  const percent = usage?.percent ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate md-label-large md-emphasized text-on-surface">
            {window.label ?? window.scope}
          </p>
          <p className="mt-1 md-body-small text-on-surface-variant">
            {window.resetAtEpochMillis
              ? `Resets ${formatDateTime(window.resetAtEpochMillis)}`
              : "No reset window reported"}
          </p>
        </div>
        <p className="md-label-large md-emphasized text-on-surface">
          {usage
            ? `${formatQuantity(usage.used, window.unit)} / ${formatQuantity(
                usage.total,
                window.unit,
              )}`
            : formatOpenUsage(window)}
        </p>
      </div>

      <MaterialLinearProgressIndicator
        className="mt-3"
        label={window.label ?? window.scope}
        value={percent}
        variant={progressVariant(percent)}
      />

      {usage ? (
        <p className="mt-1 md-body-small text-on-surface-variant">
          {formatQuantity(usage.remaining, window.unit)} remaining
        </p>
      ) : null}
    </div>
  );
}

function StatusBadge({ state }: { state: QuotaSubscription["syncState"] }) {
  const variant =
    state === "active" ? "success" : state === "pending" ? "outline" : "error";

  return (
    <MaterialBadge variant={variant} className="capitalize">
      {state.replace("_", " ")}
    </MaterialBadge>
  );
}

function quotaUsage(window: QuotaWindow) {
  if (window.total == null || window.total <= 0) return null;

  const used =
    window.used ??
    (window.remaining == null ? null : Math.max(window.total - window.remaining, 0));
  if (used == null) return null;

  const remaining =
    window.remaining ?? Math.max(window.total - Math.min(used, window.total), 0);
  const percent = clamp(Math.round((used / window.total) * 100), 0, 100);

  return {
    percent,
    remaining,
    total: window.total,
    used,
  };
}

function formatOpenUsage(window: QuotaWindow) {
  if (window.used != null) {
    return `${formatQuantity(window.used, window.unit)} used`;
  }

  if (window.remaining != null) {
    return `${formatQuantity(window.remaining, window.unit)} remaining`;
  }

  return "-";
}

function formatQuantity(value: number, unit: QuotaWindow["unit"]) {
  const normalizedUnit = unit.toLowerCase();
  if (unit === "Percent") return `${value}%`;

  return `${value.toLocaleString()} ${normalizedUnit}${value === 1 ? "" : "s"}`;
}

function formatDateTime(value: number) {
  return new Date(value).toLocaleString();
}

function progressVariant(percent: number) {
  if (percent >= 90) return "error";
  if (percent >= 70) return "tertiary";
  return "primary";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function providerInitials(displayName: string) {
  const words = displayName
    .split(/[\s.\-_]+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return (words[0][0] + words[1][0]).toUpperCase();
}
