# AI Article Summarizer Pipeline API

A robust, asynchronous AI pipeline backend built with **Hono**, **BullMQ**, **Prisma ORM (Prisma Next / v8)**, and **PostgreSQL**, running real LLM workloads via **anvia.dev / OpenAI Gateway**.

---

## 📌 Project Overview

This project implements an asynchronous background processing pipeline that takes article content, enqueues background processing jobs using **BullMQ** (powered by Redis), processes the text through AI summarization & key takeaway extraction using `@anvia/core` and `@anvia/openai`, and persists the job statuses and final outputs in a **PostgreSQL** database using **Prisma ORM**.

---

## 🛠️ Tech Stack

- **Framework**: [Hono](https://hono.dev/) with Node.js runtime (`@hono/node-server`)
- **Package Manager**: [pnpm](https://pnpm.io/)
- **Job Queue**: [BullMQ](https://bullmq.io/) + [ioredis](https://github.com/redis/ioredis)
- **Database & ORM**: [PostgreSQL 16](https://www.postgresql.org/) + [Prisma Next (ORM v8)](https://www.prisma.io/)
- **LLM Provider / SDK**: `@anvia/core`, `@anvia/openai`, `zod`
- **TypeScript & Tooling**: `tsx`, `typescript`, `dotenv`

---

## 📁 Project Architecture

Following the modular domain structure:

```text
devscale-apeii-assignment-02/
├── migrations/             # Prisma Next schema & state migrations
├── prisma/
│   └── schema.prisma       # Data contract (Job model)
├── src/
│   ├── generated/
│   │   └── prisma/         # Emitted typed contract & db client
│   ├── modules/
│   │   └── job/
│   │       ├── router.ts   # Hono route handlers (POST /jobs, GET /jobs, GET /jobs/:id)
│   │       └── service.ts  # Prisma queries & BullMQ enqueueing
│   ├── worker/
│   │   ├── config.ts       # QUEUE_NAME & Redis connection configuration
│   │   ├── queue.ts        # BullMQ Queue instance
│   │   └── worker.ts       # BullMQ Worker processor (calls LLM & saves results)
│   ├── llm/
│   │   └── models.ts       # Anvia OpenAI client & structured summarization
│   └── index.ts            # Hono application entrypoint
├── docker-compose.yml      # Dedicated PostgreSQL (55432) & Redis (6379) services
├── prisma.config.ts        # Prisma Next configuration
├── .env.example            # Environment variables template
├── package.json
└── tsconfig.json
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

```env
PORT=3000
DATABASE_URL="postgresql://hono:hono@localhost:55432/hono"
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
OPEN_AI_API_KEY="your_api_key_here"
BASE_URL="https://gateway.devscale.id/v1"
MODEL_NAME="gemini-3.7-flash"
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL & Redis Containers

```bash
docker compose up -d
```

### 3. Generate Contract & Initialize Database

```bash
pnpm contract:emit
pnpm db:init
```

### 4. Run the Application

Open two terminals:

- **Terminal 1: Start Hono API Server**
  ```bash
  pnpm dev
  ```
- **Terminal 2: Start BullMQ Worker**
  ```bash
  pnpm worker
  ```

---

## 📡 API Endpoints Specification

### 1. Enqueue Summarization Job

- **Route**: `POST /jobs`
- **Status**: `202 Accepted`
- **Request Body**:
  ```json
  {
    "title": "Agentic AI Pipelines",
    "content": "Agentic AI pipelines combined with asynchronous job queues like BullMQ allow long-running inference tasks to run reliably in the background without blocking HTTP request threads."
  }
  ```
- **Response**:
  ```json
  {
    "id": "98fe34a1-cf1c-4d77-84f4-1408d152f24e",
    "status": "QUEUED",
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
      "id": "98fe34a1-cf1c-4d77-84f4-1408d152f24e",
      "title": "Agentic AI Pipelines",
      "content": "Agentic AI pipelines combined with asynchronous...",
      "status": "COMPLETED",
      "result": "{\"summary\":\"Agentic AI pipelines utilize background queues...\",\"keyTakeaways\":[\"Decouples inference from HTTP requests\",\"Ensures resilience\"]}",
      "error": null,
      "createdAt": "2026-09-13T14:07:00.000Z"
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
    "id": "98fe34a1-cf1c-4d77-84f4-1408d152f24e",
    "title": "Agentic AI Pipelines",
    "content": "Agentic AI pipelines combined with asynchronous...",
    "status": "COMPLETED",
    "result": "{\"summary\":\"Agentic AI pipelines utilize background queues...\",\"keyTakeaways\":[\"Decouples inference from HTTP requests\",\"Ensures resilience\"]}",
    "error": null,
    "createdAt": "2026-09-13T14:07:00.000Z"
  }
  ```

---

## 🧪 Testing with cURL

```powershell
# 1. Enqueue job
curl -X POST http://localhost:3000/jobs `
  -H "Content-Type: application/json" `
  -d '{"title":"Agentic AI","content":"Agentic AI pipelines combined with asynchronous job queues allow reliable background inference."}'

# 2. List jobs
curl http://localhost:3000/jobs

# 3. Get single job
curl http://localhost:3000/jobs/<JOB_ID>

# 4. Test 404 handler
curl http://localhost:3000/jobs/non-existent-id
```

---

## 🛡️ Resilience & Persistence

- **Survives Server Restarts**: All jobs and results are persisted in PostgreSQL. You can safely stop and restart the API server (`pnpm dev`) or Worker (`pnpm worker`) and previously completed jobs remain immediately accessible.
- **Failures Handled**: If an LLM call fails, the job status updates to `FAILED` with the corresponding error message recorded in PostgreSQL.
