import "server-only";

import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import Database from "better-sqlite3";
import { Pool } from "pg";

const authSecret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET;
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

export const auth = betterAuth({
  database: createAuthDatabase(),
  secret: authSecret || "quotahub-relay-auth-disabled-development-secret",
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.AUTH_BASE_URL ||
    "http://localhost:3000",
  socialProviders:
    githubClientId && githubClientSecret
      ? {
          github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          },
        }
      : {},
  plugins: [nextCookies()],
});

export function isAuthConfigured() {
  return Boolean(githubClientId && githubClientSecret && authSecret);
}

function createAuthDatabase() {
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return new Database(process.env.SQLITE_DATABASE_PATH || "auth.sqlite");
}
