import { db } from "../../generated/prisma/db.js";
import { queue } from "../../worker/queue.js";

export async function createSummarizeJob(data: { title?: string; content: string }) {
  // 1. Save job in PostgreSQL via Prisma Next using .create()
  const createdJob = await db.orm.public.Job.create({
    title: data.title ?? null,
    content: data.content,
    status: "QUEUED",
  });

  // 2. Add job to BullMQ queue
  await queue.add("summarize-task", {
    jobId: createdJob.id,
    title: createdJob.title,
    content: createdJob.content,
  });

  return createdJob;
}

export async function getAllJobs() {
  return await db.orm.public.Job.all();
}

export async function getJobById(id: string) {
  return await db.orm.public.Job.where({ id }).first();
}
