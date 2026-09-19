import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/sqlite-schema.ts",
  out: "./drizzle-sqlite",
  dialect: "sqlite",
  dbCredentials: {
    url: "file:local.db",
  },
  verbose: true,
});
