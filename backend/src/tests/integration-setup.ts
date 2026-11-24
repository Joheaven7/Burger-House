// Import this FIRST in integration tests. It points the app at a TEST database and refuses to run against anything else.
import "dotenv/config";

const uri = process.env.MONGODB_URI_TEST;
if (!uri) {
  console.error("MONGODB_URI_TEST is not set. Add it to backend/.env, for example: mongodb+srv://USER:PASS@CLUSTER/burger-house-test?...");
  process.exit(1);
}
const databaseName = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/)?.[1] ?? "";
if (!databaseName.endsWith("-test")) {
  console.error(`Refusing to run: the test database name must end with "-test" (found "${databaseName || "none"}").`);
  process.exit(1);
}

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = uri;
process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-123456";
process.env.FRONTEND_ORIGIN = "http://localhost:3000";
process.env.LOG_LEVEL = "error";
process.env.ALLOWED_IMAGE_HOSTS = "images.example.com";