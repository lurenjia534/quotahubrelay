"use client";

import { FormEvent, useMemo, useState } from "react";
import { ProviderDescriptor, QuotaSubscription } from "@/app/lib/quota/types";

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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
      <form
        onSubmit={createSubscription}
        className="border-t border-zinc-200 pt-6 dark:border-zinc-800"
      >
        <div>
          <h2 className="text-base font-medium text-zinc-950 dark:text-zinc-50">
            Connect provider
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Credentials stay encrypted on this server and are used for quota
            refreshes.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Provider
            </span>
            <select
              value={selectedProviderId}
              onChange={(event) => {
                setSelectedProviderId(event.target.value);
                setCredentialValues({});
              }}
              className="mt-2 w-full border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-zinc-950 dark:border-zinc-700 dark:bg-black dark:text-zinc-50 dark:focus:border-zinc-100"
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.displayName}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Display name
            </span>
            <input
              value={customTitle}
              onChange={(event) => setCustomTitle(event.target.value)}
              placeholder={selectedProvider?.displayName}
              className="mt-2 w-full border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 dark:border-zinc-700 dark:bg-black dark:text-zinc-50 dark:focus:border-zinc-100"
            />
          </label>

          {selectedProvider?.credentialFields.map((field) => (
            <label key={field.key} className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {field.label}
              </span>
              <input
                type={field.isSecret ? "password" : "text"}
                required={field.isRequired}
                value={credentialValues[field.key] ?? ""}
                onChange={(event) =>
                  setCredentialValues((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
                className="mt-2 w-full border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-zinc-950 dark:border-zinc-700 dark:bg-black dark:text-zinc-50 dark:focus:border-zinc-100"
              />
            </label>
          ))}

          <button
            type="submit"
            disabled={!selectedProvider || pendingAction === "create"}
            className="w-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {pendingAction === "create" ? "Connecting..." : "Connect"}
          </button>
        </div>

        {message ? (
          <p className="mt-4 border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            {message}
          </p>
        ) : null}
      </form>

      <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-medium text-zinc-950 dark:text-zinc-50">
              Server subscriptions
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {subscriptions.length} connected provider
              {subscriptions.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="mt-5 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {subscriptions.length === 0 ? (
            <p className="py-10 text-sm text-zinc-500 dark:text-zinc-400">
              No server-managed subscriptions yet.
            </p>
          ) : (
            subscriptions.map((subscription) => (
              <SubscriptionRow
                key={subscription.id}
                pendingAction={pendingAction}
                subscription={subscription}
                onDelete={deleteSubscription}
                onRefresh={refreshSubscription}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function SubscriptionRow({
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
    <div className="grid gap-4 py-5 md:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            {subscription.displayTitle}
          </h3>
          <span className="border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            {subscription.syncState.replace("_", " ")}
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {subscription.providerDisplayName}
          {subscription.lastSyncedAt
            ? ` · synced ${new Date(subscription.lastSyncedAt).toLocaleString()}`
            : ""}
        </p>

        {resources.length > 0 ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {resources.slice(0, 4).map((resource) => (
              <div key={resource.key} className="text-sm">
                <p className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                  {resource.title}
                </p>
                <p className="text-zinc-500 dark:text-zinc-400">
                  {resource.windows[0]?.remaining ?? resource.windows[0]?.used ?? "-"}{" "}
                  {resource.windows[0]?.unit?.toLowerCase()}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => onRefresh(subscription.id)}
          disabled={pendingAction === `refresh:${subscription.id}`}
          className="border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {pendingAction === `refresh:${subscription.id}` ? "Refreshing..." : "Refresh"}
        </button>
        <button
          type="button"
          onClick={() => onDelete(subscription.id)}
          disabled={pendingAction === `delete:${subscription.id}`}
          className="border border-red-200 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/30"
        >
          {pendingAction === `delete:${subscription.id}` ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
