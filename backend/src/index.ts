import { createApp } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/db";
import { env } from "./config/env";
import { logger } from "./utils/logger";

async function main() {
  await connectDatabase();
  const server = createApp().listen(env.PORT, () => {
    logger.info("server listening", { port: env.PORT, env: env.NODE_ENV });
  });

  const shutdown = (signal: string) => {
    logger.info("shutting down", { signal });
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref(); // do not hang forever
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

process.on("unhandledRejection", (reason) => {
  logger.error("unhandled rejection", { reason: reason instanceof Error ? reason.stack : String(reason) });
});

main().catch((error) => {
  logger.error("failed to start", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});