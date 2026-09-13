import { Hono } from "hono";
import { createSummarizeJob, getAllJobs, getJobById } from "./service.js";

export const jobRouter = new Hono();

// POST /jobs - Validate and enqueue BullMQ job
jobRouter.post("/", async (c) => {
  const body = await c.req.json();
  const { title, content } = body;

  if (!content || typeof content !== "string") {
    return c.json({ error: "Article 'content' is required and must be a string." }, 400);
  }

  const job = await createSummarizeJob({ title, content });

  return c.json(
    {
      id: job.id,
      status: job.status,
      message: "Job enqueued successfully",
    },
    202
  );
});

// GET /jobs and /jobs/ - List all jobs with their statuses and results
jobRouter.get("/", async (c) => {
  const jobs = await getAllJobs();
  return c.json(jobs, 200);
});
jobRouter.get("", async (c) => {
  const jobs = await getAllJobs();
  return c.json(jobs, 200);
});

// GET /jobs/:id - Read one job's status and result by ID
jobRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const job = await getJobById(id);

  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }

  return c.json(job, 200);
});
