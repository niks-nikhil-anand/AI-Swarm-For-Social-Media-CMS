import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local", override: false });
loadEnv({ path: ".env", override: false });

function defaultShadowDatabaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const parsed = new URL(url);
  const database = parsed.pathname.replace(/^\//, "") || "swarm";
  parsed.pathname = `/${database}_shadow`;
  return parsed.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"] ?? defaultShadowDatabaseUrl(process.env["DATABASE_URL"]),
  },
});
