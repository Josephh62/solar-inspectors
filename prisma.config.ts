import path from "node:path";
import { defineConfig } from "prisma/config";

const url = process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
const authToken = process.env.DATABASE_AUTH_TOKEN;

// For Turso, embed the auth token as a query param so the Prisma CLI can connect
const datasourceUrl =
  authToken && url.startsWith("libsql://")
    ? `${url}?authToken=${authToken}`
    : url;

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: { url: datasourceUrl },
});
