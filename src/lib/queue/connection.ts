import IORedis from "ioredis";
import { env } from "@/lib/env";

let connection: IORedis | null = null;

/** Shared BullMQ Redis connection (maxRetriesPerRequest: null per BullMQ docs). */
export function redisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(env().REDIS_URL, { maxRetriesPerRequest: null });
  }
  return connection;
}
