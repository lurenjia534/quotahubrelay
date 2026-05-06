import "server-only";

import { APIError, betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import Database from "better-sqlite3";
import { Pool } from "pg";

const authSecret = process.env.BETTER_AUTH_SECRET;
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const allowedEmails = parseAllowedEmails(process.env.AUTH_ALLOWED_EMAILS);

export const auth = betterAuth({
  database: createAuthDatabase(),
  secret: authSecret || "quotahub-relay-auth-disabled-development-secret",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  socialProviders:
    githubClientId && githubClientSecret
      ? {
          github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          },
        }
      : {},
  databaseHooks: {
    user: {
      create: {
        async before(user) {
          assertAllowedEmail(user.email);
        },
      },
    },
    session: {
      create: {
        async before(session, context) {
          const user = await context?.context.internalAdapter.findUserById(
            session.userId,
          );

          assertAllowedEmail(user?.email);
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export function isAuthConfigured() {
  return Boolean(
    githubClientId && githubClientSecret && authSecret && allowedEmails.size > 0,
  );
}

export function isAuthorizedUser(user?: { email?: string | null } | null) {
  return isAllowedEmail(user?.email);
}

function parseAllowedEmails(value?: string) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function isAllowedEmail(email?: string | null) {
  if (allowedEmails.size === 0) {
    return false;
  }

  return Boolean(email && allowedEmails.has(email.toLowerCase()));
}

function assertAllowedEmail(email?: string | null) {
  if (!isAllowedEmail(email)) {
    throw new APIError("FORBIDDEN", { message: "access denied" });
  }
}

function createAuthDatabase() {
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return new Database(process.env.SQLITE_DATABASE_PATH || "auth.sqlite");
}
