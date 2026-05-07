"use client";

import { useState } from "react";
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
      <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="max-w-2xl">
            <h2 className="text-base font-medium text-zinc-950 dark:text-zinc-50">
              Server coordination
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Gate remote client access before this server accepts Bearer-token
              relay requests.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={remoteClientAccessEnabled}
            disabled={pendingAction === "settings"}
            onClick={() =>
              updateRemoteClientAccess(!remoteClientAccessEnabled)
            }
            className="inline-flex items-center gap-3 justify-self-start text-left disabled:cursor-not-allowed disabled:opacity-60 lg:justify-self-end"
          >
            <span
              className={`flex h-6 w-11 shrink-0 items-center border transition ${
                remoteClientAccessEnabled
                  ? "border-zinc-950 bg-zinc-950 dark:border-zinc-50 dark:bg-zinc-50"
                  : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-black"
              }`}
            >
              <span
                className={`block h-4 w-4 bg-zinc-300 transition dark:bg-zinc-600 ${
                  remoteClientAccessEnabled
                    ? "translate-x-5 bg-white dark:bg-zinc-950"
                    : "translate-x-1"
                }`}
              />
            </span>
            <span>
              <span className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Remote client mode
              </span>
              <span className="block max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                Allow trusted QuotaHub Android clients to link to this web server
                after strict authentication.
              </span>
            </span>
          </button>
        </div>

        <div className="mt-5 border-y border-zinc-200 py-4 dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            {remoteClientAccessEnabled
              ? "Client endpoints armed"
              : "Web dashboard only"}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {remoteClientAccessEnabled
              ? "Bearer-token relay endpoints are available to generated client tokens."
              : "Bearer-token relay endpoints are closed. QuotaHub Relay still works as a web dashboard."}
          </p>
        </div>
      </section>

      <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="text-base font-medium text-zinc-950 dark:text-zinc-50">
          Android client access
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Generate a Bearer token for QuotaHub Android remote client mode.
          Tokens can read relay endpoints only when remote client mode is on.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Token name
            </span>
            <input
              value={clientTokenName}
              onChange={(event) => setClientTokenName(event.target.value)}
              className="mt-2 w-full border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-zinc-950 dark:border-zinc-700 dark:bg-black dark:text-zinc-50 dark:focus:border-zinc-100"
            />
          </label>

          <button
            type="button"
            disabled={pendingAction === "create"}
            onClick={createClientToken}
            className="w-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {pendingAction === "create" ? "Creating..." : "Create client token"}
          </button>
        </div>

        {newClientToken ? (
          <div className="mt-5 border border-amber-200 bg-amber-50 px-3 py-3 dark:border-amber-950 dark:bg-amber-950/30">
            <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
              Copy this token now. It will not be shown again.
            </p>
            <code className="mt-2 block break-all text-xs text-amber-900 dark:text-amber-200">
              {newClientToken}
            </code>
          </div>
        ) : null}

        {message ? (
          <p className="mt-4 border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            {message}
          </p>
        ) : null}
      </section>

      <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-medium text-zinc-950 dark:text-zinc-50">
            Active client tokens
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Revoke a token when a device is lost or no longer trusted.
          </p>
        </div>

        <div className="mt-5 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {clientTokens.length === 0 ? (
            <p className="py-10 text-sm text-zinc-500 dark:text-zinc-400">
              No Android client tokens yet.
            </p>
          ) : (
            clientTokens.map((token) => (
              <div
                key={token.id}
                className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-start"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {token.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {token.tokenPrefix}... · created{" "}
                    {new Date(token.createdAt).toLocaleString()}
                    {token.lastUsedAt
                      ? ` · last used ${new Date(token.lastUsedAt).toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revokeClientToken(token.id)}
                  disabled={pendingAction === `delete:${token.id}`}
                  className="border border-red-200 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/30"
                >
                  {pendingAction === `delete:${token.id}` ? "Revoking..." : "Revoke"}
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
