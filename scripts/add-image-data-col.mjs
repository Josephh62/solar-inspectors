// Adds imageData column to Photo table in Turso.
// Safe to re-run — ignores "duplicate column" errors.
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
if (!url?.startsWith("libsql://")) {
  console.log("Not a Turso database, skipping migration.");
  process.exit(0);
}

const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN ?? undefined,
});

try {
  await client.execute("ALTER TABLE Photo ADD COLUMN imageData TEXT");
  console.log("✓ Added imageData column to Photo table");
} catch (err) {
  const msg = err?.message ?? "";
  if (msg.includes("duplicate column") || msg.includes("already exists")) {
    console.log("✓ imageData column already exists");
  } else {
    // Non-fatal — column may have been added by a different migration path.
    // Never block the build for a migration error.
    console.warn("Migration warning (non-fatal):", err?.message ?? err);
  }
}
