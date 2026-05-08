import "server-only";

import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as pgSchema from "@/app/lib/db/schema.pg";
import * as sqliteSchema from "@/app/lib/db/schema.sqlite";

const databaseUrl = process.env.DATABASE_URL;

const sqliteClient = databaseUrl
  ? null
  : new Database(process.env.SQLITE_DATABASE_PATH || "auth.sqlite");
const pgPool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

export const quotaDb = pgPool
  ? {
      kind: "pg" as const,
      db: drizzlePg(pgPool, { schema: pgSchema }),
      schema: pgSchema,
      raw: pgPool,
    }
  : {
      kind: "sqlite" as const,
      db: drizzleSqlite(sqliteClient!, { schema: sqliteSchema }),
      schema: sqliteSchema,
      raw: sqliteClient!,
    };

export function createAuthDatabase() {
  return quotaDb.raw;
}

export type QuotaDb = typeof quotaDb;
