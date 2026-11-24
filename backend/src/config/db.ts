import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  // Create every collection and index (including the unique ones that make orders safe) before serving requests.
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));
  logger.info("database connected");
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}