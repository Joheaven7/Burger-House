import { connectDatabase, disconnectDatabase } from "../config/db";
import { Order } from "../models/order";

// Data-retention routine (decision D-10). Removes customers' personal details from OLD orders while keeping the
// order totals and items for the restaurant's records. It does nothing unless you choose a number of days.
// Usage:  npm run retention -- --days 365           (preview only)
//         npm run retention -- --days 365 --apply   (really changes the data)
async function main() {
  const args = process.argv.slice(2);
  const daysIndex = args.indexOf("--days");
  const days = daysIndex >= 0 ? Number(args[daysIndex + 1]) : NaN;
  const apply = args.includes("--apply");
  if (!Number.isInteger(days) || days < 30) throw new Error("Give a number of days of at least 30, for example: --days 365");

  await connectDatabase();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const filter = { createdAt: { $lt: cutoff }, customerName: { $ne: "Redacted" } };
  const count = await Order.countDocuments(filter);
  console.log(`${count} order(s) older than ${days} days (before ${cutoff.toISOString().slice(0, 10)}) still contain personal details.`);

  if (!apply) {
    console.log("Preview only. Add --apply to remove the names, phone numbers, addresses and notes from these orders.");
  } else if (count > 0) {
    const result = await Order.updateMany(filter, { $set: { customerName: "Redacted", phoneE164: "REDACTED" }, $unset: { address: 1, note: 1 } });
    console.log(`Anonymised ${result.modifiedCount} order(s).`);
  }
  await disconnectDatabase();
}

main().catch(async (error) => {
  console.error("Failed:", error instanceof Error ? error.message : error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});