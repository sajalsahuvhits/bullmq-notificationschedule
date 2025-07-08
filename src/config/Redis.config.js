import { Redis } from "ioredis";

const RedisConnection = new Redis(
  {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  { maxRetriesPerRequest: null }
);
RedisConnection.on("connect", () => {
  console.log("✅ Redis connected successfully");
});
RedisConnection.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});
export default RedisConnection;
