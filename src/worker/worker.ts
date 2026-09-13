import { Worker, Job } from "bullmq";
import { QUEUE_NAME, workerConnection } from "./config.js";
import { db } from "../generated/prisma/db.js";
import { summarizeArticle } from "../llm/models.js";

export const worker = new Worker(
  QUEUE_NAME,
  async (job: Job<{ jobId: string; content: string; title?: string }>) => {
    const { jobId, content, title } = job.data;
    console.log(`[Worker] Processing Job ${jobId}...`);

    // 1. Update status to PROCESSING
    await db.orm.public.Job.where({ id: jobId }).update({
      status: "PROCESSING",
    });

    try {
      // 2. Call real AI model via Anvia
      const resultText = await summarizeArticle(content, title);

      // 3. Mark COMPLETED with result
      await db.orm.public.Job.where({ id: jobId }).update({
        status: "COMPLETED",
        result: resultText,
      });

      console.log(`[Worker] Job ${jobId} COMPLETED successfully.`);
    } catch (error: any) {
      console.error(`[Worker] Job ${jobId} FAILED:`, error.message);

      // 4. Mark FAILED with error
      await db.orm.public.Job.where({ id: jobId }).update({
        status: "FAILED",
        error: error.message || "Failed to process summarization",
      });

      throw error;
    }
  },
  {
    connection: workerConnection,
  }
);

console.log("🚀 BullMQ Summarizer Worker is active and listening for jobs...");
