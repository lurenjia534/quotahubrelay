import { auth, isAuthConfigured } from "@/app/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const runtime = "nodejs";

const handlers = toNextJsHandler(auth);

function rejectIfUnconfigured() {
  if (isAuthConfigured()) {
    return null;
  }

  return Response.json(
    { error: "GitHub SSO is not configured." },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  return rejectIfUnconfigured() ?? handlers.GET(request);
}

export async function POST(request: Request) {
  return rejectIfUnconfigured() ?? handlers.POST(request);
}
