import { jsonError, requireSessionUser } from "@/app/lib/quota/api";
import {
  createClientToken,
  listClientTokens,
} from "@/app/lib/quota/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await requireSessionUser(request);
  if (user instanceof Response) return user;

  const clientTokens = await listClientTokens(user.id);
  return Response.json({ clientTokens });
}

export async function POST(request: Request) {
  const user = await requireSessionUser(request);
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_json", "Request body must be valid JSON.", 400);
  }

  const name = parseTokenName(body);
  if (!name) {
    return jsonError("invalid_name", "`name` is required.", 400);
  }

  const result = await createClientToken(user.id, name);
  return Response.json(result, { status: 201 });
}

function parseTokenName(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const name = (value as Record<string, unknown>).name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}
