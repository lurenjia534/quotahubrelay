import { jsonError, requireSessionUser } from "@/app/lib/quota/api";
import {
  getRelaySettings,
  updateRelaySettings,
} from "@/app/lib/quota/store";
import {
  isRelayRefreshMode,
  relayRefreshModes,
} from "@/app/lib/quota/types";
import type { RelaySettings } from "@/app/lib/quota/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await requireSessionUser(request);
  if (user instanceof Response) return user;

  const settings = await getRelaySettings(user.id);
  return Response.json({ settings });
}

export async function PATCH(request: Request) {
  const user = await requireSessionUser(request);
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_json", "Request body must be valid JSON.", 400);
  }

  const input = parseSettingsBody(body);
  if (input instanceof Response) return input;

  const currentSettings = await getRelaySettings(user.id);
  const settings = await updateRelaySettings(user.id, {
    ...currentSettings,
    ...input,
  });
  return Response.json({ settings });
}

function parseSettingsBody(value: unknown): Partial<RelaySettings> | Response {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return jsonError("invalid_body", "Request body must be an object.", 400);
  }

  const body = value as Record<string, unknown>;
  const settings: Partial<RelaySettings> = {};

  if (Object.prototype.hasOwnProperty.call(body, "remoteClientAccessEnabled")) {
    if (typeof body.remoteClientAccessEnabled !== "boolean") {
      return jsonError(
        "invalid_remote_client_access",
        "`remoteClientAccessEnabled` must be a boolean.",
        400,
      );
    }

    settings.remoteClientAccessEnabled = body.remoteClientAccessEnabled;
  }

  if (Object.prototype.hasOwnProperty.call(body, "refreshMode")) {
    if (!isRelayRefreshMode(body.refreshMode)) {
      return jsonError(
        "invalid_refresh_mode",
        `\`refreshMode\` must be one of: ${relayRefreshModes.join(", ")}.`,
        400,
      );
    }

    settings.refreshMode = body.refreshMode;
  }

  if (Object.keys(settings).length === 0) {
    return jsonError(
      "invalid_body",
      "At least one relay setting is required.",
      400,
    );
  }

  return settings;
}
