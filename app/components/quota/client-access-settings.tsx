"use client";

import { useState } from "react";
import { RelayClientToken } from "@/app/lib/quota/types";

type ClientAccessSettingsProps = {
  initialClientTokens: RelayClientToken[];
};

export function ClientAccessSettings({
  initialClientTokens,
}: ClientAccessSettingsProps) {
  const [clientTokens, setClientTokens] = useState(initialClientTokens);
  const [newClientToken, setNewClientToken] = useState<string | null>(null);
  const [clientTokenName, setClientTokenName] = useState("Android client");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
      <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="text-base font-medium text-zinc-950 dark:text-zinc-50">
          Android client access
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Generate a Bearer token for QuotaHub Android remote client mode.
          Tokens can read relay endpoints for this account.
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
