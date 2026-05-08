import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
const sqlitePath = process.env.SQLITE_DATABASE_PATH || "auth.sqlite";

export default defineConfig(
  databaseUrl
    ? {
        dialect: "postgresql",
        schema: "./app/lib/db/schema.pg.ts",
        out: "./drizzle/pg",
        tablesFilter: ["quota_*"],
        dbCredentials: {
          url: databaseUrl,
        },
      }
    : {
        dialect: "sqlite",
        schema: "./app/lib/db/schema.sqlite.ts",
        out: "./drizzle/sqlite",
        tablesFilter: ["quota_*"],
        dbCredentials: {
          url: sqlitePath,
        },
      },
);
