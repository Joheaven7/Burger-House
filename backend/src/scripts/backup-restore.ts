import { readFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/db";

// Restores a backup made by "npm run backup" into the database in MONGODB_URI.
// For safety it ONLY restores into an EMPTY database (it never overwrites existing data).
// Usage:  npm run restore -- backups/2026-11-02-14-30
async function main() {
  const folder = process.argv[2];
  if (!folder) throw new Error("Tell me which backup folder to restore, for example: npm run restore -- backups/2026-11-02-14-30");

  const manifest = JSON.parse(await readFile(path.join(folder, "manifest.json"), "utf8")) as { counts: Record<string, number>; database: string };
  await connectDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error("No database connection");
  const { EJSON } = mongoose.mongo.BSON;

  for (const name of Object.keys(manifest.counts)) {
    const existing = await db.collection(name).countDocuments();
    if (existing > 0) {
      throw new Error(`Refusing to restore: "${name}" in database "${mongoose.connection.name}" already has ${existing} documents. Restore into an empty database.`);
    }
  }

  const restored: Record<string, number> = {};
  for (const name of Object.keys(manifest.counts)) {
    const documents = EJSON.parse(await readFile(path.join(folder, `${name}.json`), "utf8"), { relaxed: false }) as Record<string, unknown>[];
    if (documents.length > 0) await db.collection(name).insertMany(documents as never[], { ordered: false });
    restored[name] = await db.collection(name).countDocuments();
    if (restored[name] !== manifest.counts[name]) throw new Error(`Count mismatch in ${name}: backup ${manifest.counts[name]}, restored ${restored[name]}`);
  }
  // Rebuild indexes (the models create them on startup too).
  await Promise.all(mongoose.modelNames().map((model) => mongoose.model(model).syncIndexes().catch(() => undefined)));

  console.log(`Restored backup from "${manifest.database}" into "${mongoose.connection.name}". All counts match:`);
  console.table(restored);
  console.log('Next: create the admin again with "npm run admin:create".');
  await disconnectDatabase();
}

main().catch(async (error) => {
  console.error("Restore failed:", error instanceof Error ? error.message : error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});