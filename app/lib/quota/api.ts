import "server-only";

import { auth, isAuthorizedUser } from "@/app/lib/auth";
import { ProviderSyncError } from "@/app/lib/quota/types";
import {
  findClientTokenAuth,
  getRelaySettings,
  markClientTokenUsed,
} from "@/app/lib/quota/store";

export type ApiUser = {
  id: string;
  email?: string | null;
};

export async function requireApiUser(request: Request): Promise<ApiUser | Response> {
  const sessionUser = await sessionUserFromRequest(request);
  if (sessionUser instanceof Response) {
    const bearerUser = await bearerUserFromRequest(request);
    return bearerUser ?? sessionUser;
  }

  return sessionUser;
}

export async function requireSessionUser(request: Request): Promise<ApiUser | Response> {
  return sessionUserFromRequest(request);
}

async function sessionUserFromRequest(request: Request): Promise<ApiUser | Response> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  const user = session?.user;

  if (!user) {
    return jsonError("not_authenticated", "Not authenticated.", 401);
  }
  if (!isAuthorizedUser(user)) {
    return jsonError("access_denied", "This GitHub account is not allowed.", 403);
  }

  return {
    id: user.id,
    email: user.email,
  };
}

async function bearerUserFromRequest(request: Request): Promise<ApiUser | Response | null> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return null;
  const clientToken = await findClientTokenAuth(token);
  if (!clientToken) return null;

  const settings = await getRelaySettings(clientToken.userId);
  if (!settings.remoteClientAccessEnabled) {
    return jsonError(
      "remote_client_disabled",
      "Remote client mode is disabled for this account.",
      403,
    );
  }

  await markClientTokenUsed(clientToken.tokenId);
  return { id: clientToken.userId };
}

export function jsonError(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

export function providerErrorResponse(error: unknown) {
  if (error instanceof ProviderSyncError) {
    return jsonError(error.type, error.message, error.status ?? statusForProviderError(error));
  }

  return jsonError(
    "unknown",
    error instanceof Error ? error.message : "Unexpected server error.",
    500,
  );
}

function statusForProviderError(error: ProviderSyncError) {
  switch (error.type) {
    case "auth":
      return 401;
    case "rate_limited":
      return 429;
    case "transient":
      return 503;
    case "schema_changed":
      return 502;
    case "validation":
      return 400;
    case "unknown":
      return 500;
  }
}
