"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  Database,
  Layers3,
  Plus,
} from "lucide-react";
import {
  ProviderDescriptor,
  QuotaSubscription,
} from "@/app/lib/quota/types";
import {
  MaterialAlert,
  MaterialBadge,
  MaterialButton,
  MaterialIconSurface,
  MaterialSectionHeader,
  MaterialTextField,
} from "@/app/components/material/primitives";
import {
  formatDateTime,
  getSubscriptionSummary,
  OpenDetailsHint,
  ResourcePreviewChips,
  SubscriptionStatusBadge,
  SummaryGlyph,
  SummaryProgress,
} from "@/app/components/quota/subscription-display";
import {
  expressiveContainer,
  expressiveItem,
  expressiveListItem,
  materialDefaultSpatial,
  materialFastSpatial,
  materialPress,
  materialRowHover,
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

          <div className="grid gap-3 pt-5">
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
                <SubscriptionSummaryCard
                  key={subscription.id}
                  subscription={subscription}
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
                    whileHover={materialRowHover}
                    whileTap={materialPress}
                    onClick={() => {
                      setSelectedProviderId(provider.id);
                      setCredentialValues({});
                    }}
                    aria-pressed={isSelected}
                    className={cn(
                      "md-state-layer md-expressive-surface relative flex min-h-16 w-full items-center gap-3 overflow-hidden px-3 text-left",
                      "transition-[background-color,border-radius,color,font-variation-settings,transform] duration-300 ease-[var(--md-sys-motion-easing-standard)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25",
                      isSelected
                        ? "text-on-primary-container"
                        : "bg-surface-container-low text-on-surface",
                    )}
                  >
                    {isSelected ? (
                      <motion.span
                        className="absolute inset-0 rounded-[inherit] bg-primary-container"
                        layoutId="provider-selected-container"
                        transition={materialDefaultSpatial}
                      />
                    ) : null}
                    <span
                      className={cn(
                        "relative z-10 grid size-11 shrink-0 place-items-center rounded-full md-label-large md-emphasized",
                        isSelected
                          ? "bg-primary text-on-primary"
                          : "bg-surface text-on-surface-variant",
                      )}
                      aria-hidden="true"
                    >
                      {providerInitials(provider.displayName)}
                    </span>
                    <span className="relative z-10 min-w-0 flex-1">
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
                      <motion.span
                        className="relative z-10"
                        initial={{ opacity: 0, scale: 0.72 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={materialFastSpatial}
                      >
                        <Check className="size-5 shrink-0" aria-hidden="true" />
                      </motion.span>
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

function SubscriptionSummaryCard({
  subscription,
}: {
  subscription: QuotaSubscription;
}) {
  const summary = getSubscriptionSummary(subscription);

  return (
    <motion.article
      layout
      variants={expressiveListItem}
      initial="hidden"
      animate="show"
      exit="exit"
      whileHover={materialRowHover}
      whileTap={materialPress}
    >
      <Link
        href={`/dashboard/subscriptions/${subscription.id}`}
        className="md-state-layer md-expressive-surface grid gap-5 bg-surface-container-low px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="flex min-w-0 gap-4">
            <SummaryGlyph />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="min-w-0 truncate md-title-large md-emphasized text-on-surface">
                  {subscription.displayTitle}
                </h3>
                <SubscriptionStatusBadge state={subscription.syncState} />
              </div>
              <p className="mt-1 md-body-medium text-on-surface-variant">
                {subscription.providerDisplayName}
                {subscription.lastSyncedAt
                  ? ` · synced ${formatDateTime(subscription.lastSyncedAt)}`
                  : ""}
              </p>
            </div>
          </div>
          <OpenDetailsHint />
        </div>

        <div className="grid border-y border-outline-variant py-2 sm:grid-cols-3 sm:divide-x sm:divide-outline-variant">
          <SummaryMetric label="Resources" value={summary.resourceCount} />
          <SummaryMetric label="Windows" value={summary.windowCount} />
          <div className="px-1 py-3 sm:px-4">
            <p className="md-label-large text-on-surface-variant">State</p>
            <div className="mt-2">
              <MaterialBadge variant={summary.riskVariant}>
                {summary.riskLabel}
              </MaterialBadge>
            </div>
          </div>
        </div>

        <SummaryProgress summary={summary} />
        <ResourcePreviewChips
          resources={summary.sampledResources}
          total={summary.resourceCount}
        />
      </Link>
    </motion.article>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="px-1 py-3 sm:px-4">
      <p className="md-label-large text-on-surface-variant">{label}</p>
      <p className="mt-1 md-title-large md-emphasized text-on-surface">
        {value}
      </p>
    </div>
  );
}

function providerInitials(displayName: string) {
  const words = displayName
    .split(/[\s.\-_]+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return (words[0][0] + words[1][0]).toUpperCase();
}
