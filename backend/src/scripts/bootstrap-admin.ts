import { z } from "zod";
import { connectDatabase, disconnectDatabase } from "../config/db";
import { upsertAdmin } from "../services/auth.service";
import { checkPasswordStrength } from "../utils/security";

// Reads the email and password from environment variables set only for this one command.
// It never prints the password. If the email already exists, its password is reset.
async function main() {
  const email = z.string().trim().toLowerCase().email().safeParse(process.env.ADMIN_BOOTSTRAP_EMAIL);
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "";
  if (!email.success) throw new Error("ADMIN_BOOTSTRAP_EMAIL is missing or not a valid email address.");
  const problem = checkPasswordStrength(password);
  if (problem) throw new Error(`ADMIN_BOOTSTRAP_PASSWORD ${problem}.`);

  await connectDatabase();
  const result = await upsertAdmin(email.data, password);
  console.log(result === "created" ? `Admin created: ${email.data}` : `Password reset for: ${email.data}`);
  await disconnectDatabase();
}

main().catch(async (error) => {
  console.error("Failed:", error instanceof Error ? error.message : error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});