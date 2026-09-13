import "dotenv/config";

export const QUEUE_NAME = "article-summarizer-queue";

export const workerConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
};
