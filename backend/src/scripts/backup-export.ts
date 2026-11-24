import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/db";

// Exports the important collections to JSON files in backend/backups/<date>/ (kept out of Git).
// Sessions and idempotency records are not saved (they expire anyway). Admin password hashes are NOT exported:
// after a restore you create the admin again with "npm run admin:create".
// WARNING: order files contain customers' names, phone numbers and addresses. Store them securely.
const COLLECTIONS = ["settings", "menucategories", "menuitems", "orders", "orderstatushistories", "ordercounters", "auditlogs", "adminusers"];

async function main() {
  await connectDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error("No database connection");
  const { EJSON } = mongoose.mongo.BSON;

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const folder = path.join("backups", stamp);
  await mkdir(folder, { recursive: true });

  const counts: Record<string, number> = {};
  for (const name of COLLECTIONS) {
    const documents = await db.collection(name).find({}).toArray();
    const safe = name === "adminusers" ? documents.map(({ passwordHash: _hash, ...rest }) => rest) : documents;
    await writeFile(path.join(folder, `${name}.json`), EJSON.stringify(safe, { relaxed: false }, 2));
    counts[name] = safe.length;
  }
  await writeFile(
    path.join(folder, "manifest.json"),
    JSON.stringify({ createdAt: new Date().toISOString(), database: mongoose.connection.name, counts }, null, 2),
  );
  console.log(`Backup saved to ${folder}`);
  console.table(counts);
  await disconnectDatabase();
}

main().catch(async (error) => {
  console.error("Backup failed:", error instanceof Error ? error.message : error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});