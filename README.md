# AI Article Summarizer Pipeline API

A robust, asynchronous AI pipeline backend built with **Hono**, **BullMQ**, **Prisma ORM**, and **PostgreSQL**, running real LLM workloads via **anvia.dev**.

---

## 📌 Project Overview

This project implements an asynchronous background processing pipeline that takes article content/URLs, enqueues background processing jobs using **BullMQ** (powered by Redis), processes the text through multi-step AI summarization & key takeaway extraction using **anvia.dev**, and persists the job statuses and final outputs in a **PostgreSQL** database using **Prisma ORM**.

---

## 🛠️ Tech Stack

- **Framework**: [Hono](https://hono.dev/) (TypeScript / Node.js)
- **Job Queue**: [BullMQ](https://bullmq.io/) + [Redis](https://redis.io/)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) + [Prisma](https://www.prisma.io/)
- **LLM Provider**: [anvia.dev](https://anvia.dev)
- **Runtime / Package Manager**: Node.js / `pnpm` (or `npm` / `bun`)

---

## 🚀 Pipeline Workflow (Article Summarizer)

1. **Client Submission (`POST /jobs`)**:
   - Accepts article text/URL and processing configuration (e.g., target length, language, bullet count).
   - Validates input and creates an initial record in PostgreSQL with status `PENDING` / `QUEUED`.
   - Dispatches a job to the BullMQ Redis queue.
   - Returns `202 Accepted` immediately with `jobId` and `status`.

2. **Asynchronous Worker Execution (`BullMQ Worker`)**:
   - Worker picks up the job from the Redis queue.
   - Updates status to `PROCESSING` in PostgreSQL.
   - **Step 1**: Preprocesses and chunks long article text if necessary.
   - **Step 2**: Calls **anvia.dev** API to generate a structured executive summary, key insights, and action points.
   - **Step 3**: Updates PostgreSQL record to `COMPLETED` with the structured result, or `FAILED` with error details if an issue occurs.

3. **Status & Result Polling**:
   - Clients poll `GET /jobs/:id` or list jobs with `GET /jobs`.
   - Results return `null` while pending/processing, and populated once completed.

---

## 📡 API Endpoints Specification

### 1. Enqueue Summarization Job
- **Route**: `POST /jobs`
- **Status**: `202 Accepted`
- **Request Body**:
  ```json
  {
    "title": "Future of AI in Software Engineering",
    "content": "Full article text goes here...",
    "options": {
      "format": "bullet_points", // "executive_summary" | "bullet_points" | "tldr"
      "language": "en"
    }
  }
  ```
- **Response**:
  ```json
  {
    "id": "job_clw1234567890",
    "status": "QUEUED",
    "createdAt": "2026-09-13T12:00:00.000Z",
    "message": "Job enqueued successfully"
  }
  ```

---

### 2. List All Jobs
- **Route**: `GET /jobs`
- **Status**: `200 OK`
- **Response**:
  ```json
  [
    {
      "id": "job_clw1234567890",
      "title": "Future of AI in Software Engineering",
      "status": "COMPLETED",
      "result": {
        "summary": "Artificial Intelligence is rapidly transforming software workflows...",
        "keyTakeaways": [
          "Automated pipelines increase delivery velocity.",
          "Asynchronous task handling ensures resilient architecture."
        ]
      },
      "error": null,
      "createdAt": "2026-09-13T12:00:00.000Z",
      "updatedAt": "2026-09-13T12:00:05.000Z"
    },
    {
      "id": "job_clw9876543210",
      "title": "Deep Dive into Distributed Queues",
      "status": "PROCESSING",
      "result": null,
      "error": null,
      "createdAt": "2026-09-13T12:01:00.000Z",
      "updatedAt": "2026-09-13T12:01:02.000Z"
    }
  ]
  ```

---

### 3. Get Job Details & Result by ID
- **Route**: `GET /jobs/:id`
- **Status**: `200 OK` (or `404 Not Found`)
- **Response (Completed)**:
  ```json
  {
    "id": "job_clw1234567890",
    "title": "Future of AI in Software Engineering",
    "status": "COMPLETED",
    "result": {
      "summary": "Artificial Intelligence is rapidly transforming software workflows...",
      "keyTakeaways": [
        "Automated pipelines increase delivery velocity.",
        "Asynchronous task handling ensures resilient architecture."
      ]
    },
    "error": null,
    "createdAt": "2026-09-13T12:00:00.000Z",
    "updatedAt": "2026-09-13T12:00:05.000Z"
  }
  ```
- **Response (Pending/Processing)**:
  ```json
  {
    "id": "job_clw9876543210",
    "title": "Deep Dive into Distributed Queues",
    "status": "PROCESSING",
    "result": null,
    "error": null,
    "createdAt": "2026-09-13T12:01:00.000Z",
    "updatedAt": "2026-09-13T12:01:02.000Z"
  }
  ```

---

## 🗄️ Database Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum JobStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
}

model Job {
  id        String    @id @default(cuid())
  title     String?
  input     Json
  status    JobStatus @default(QUEUED)
  result    Json?
  error     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([status])
}
```

---

## ⚙️ Environment Variables (`.env`)

```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/article_summarizer_db?schema=public"
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
ANVIA_API_KEY="your_anvia_api_key_here"
ANVIA_BASE_URL="https://anvia.dev/api/v1"
```

---

## 🏃 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd devscale-apeii-assignment-02
npm install
```

### 2. Configure Database & Services
Ensure Redis and PostgreSQL are running, then run migrations:
```bash
npx prisma migrate dev --name init
```

### 3. Run the Development Server & Worker
```bash
# Run API server & BullMQ worker concurrently
npm run dev
```

---

## 🧪 Testing & Verification

1. **Start Job**:
   ```bash
   curl -X POST http://localhost:3000/jobs \
     -H "Content-Type: application/json" \
     -d '{"title":"Tech Post","content":"Antigravity AI is an innovative assistant..."}'
   ```
2. **List Jobs**:
   ```bash
   curl http://localhost:3000/jobs
   ```
3. **Inspect Single Job**:
   ```bash
   curl http://localhost:3000/jobs/<job-id>
   ```
4. **Resilience Check**:
   Restart the API server mid-execution to verify that state and completed jobs persist safely in PostgreSQL.
