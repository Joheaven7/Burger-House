// Import this FIRST in every test file: it gives the app safe dummy settings so tests never touch a real database.
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/burger-house-test";
process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-123456";
process.env.FRONTEND_ORIGIN = "http://localhost:3000";
process.env.LOG_LEVEL = "error";
process.env.ALLOWED_IMAGE_HOSTS = "images.example.com";
process.env.INTERNAL_API_KEY = "internal-key-internal-key-internal-key-1";