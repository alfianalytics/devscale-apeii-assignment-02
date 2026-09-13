import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { jobRouter } from "./modules/job/router.js";

const app = new Hono();

app.use(trimTrailingSlash());

app.get("/", (c) => {
  return c.text("Article Summarizer AI Pipeline API is running!");
});

// Mount /jobs module
app.route("/jobs", jobRouter);

const port = Number(process.env.PORT) || 3000;
serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`🚀 Server is running on http://localhost:${info.port}`);
  }
);
