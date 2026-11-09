---
title: Realty AI Platform
description: A bilingual real-estate marketplace with property search, buyer and agent features, and AI-assisted discovery.
---

## Overview

Realty AI Platform is a real-estate marketplace for discovering properties and connecting buyers with agents. The web application supports English and Spanish, while the API manages users, property listings, favorites, conversations, reviews, appointments, and AI-assisted property search.

The repository contains a Next.js frontend, a NestJS backend, Python API and browser tests, and Bruno requests for exercising the API.

## Features

* Browse, filter, and paginate property listings
* Register and sign in as users, agents, or administrators
* Let agents create, update, and remove property listings
* Save favorite listings and message about properties
* Schedule appointments and review agents
* Search for properties using natural-language questions with Ollama
* Store listing data in PostgreSQL and listing images in Cloudinary
* Use Typesense for search, Memcached for caching, and Redis for queue infrastructure
* Switch the interface between English and Spanish

## Architecture

| Component | Technologies | Responsibilities |
|-----------|--------------|------------------|
| `web/` | Next.js, React, TypeScript, Tailwind CSS, next-intl | Localized marketplace interface |
| `backend/` | NestJS, Prisma, PostgreSQL | REST API, authentication, and marketplace services |
| `qa-py/` | pytest, Playwright, HTTPX, DeepEval | API, browser, and AI/RAG quality tests |
| `realestate-curl/` | Bruno | Reusable API request collection |

PostgreSQL is the source of structured application data. Typesense, Memcached, Redis, Cloudinary, and Ollama provide search, caching, queue, image, and language-model integrations.

## Prerequisites

Install the following tools before running the project:

* Node.js 20 or later
* pnpm
* Docker with the Docker Compose plugin
* Python 3.10 or later for the QA suite
* Ollama and a locally available model for AI-powered search

## Run locally

### Start the full local stack

After configuring `backend/.env` and `web/.env` (or `web/.env.local`), run this
from the repository root:

```bash
./start-all.sh
```

The script starts the Docker services, applies database migrations, and runs
the API and frontend. Press `Ctrl+C` to stop the API and frontend. The Docker
services remain running; stop them with `cd backend && docker compose down`.

### Start backend dependencies

From the backend directory, start the database and supporting services:

```bash
cd backend
docker compose up -d db memcached typesense redis
```

The Compose file maps PostgreSQL to port `5433`, Memcached to `11212`,
Typesense to `8109`, and Redis to `6379` on your machine.

### Configure and start the API

Create `backend/.env` and set the variables used by the API:

```dotenv
DATABASE_URL=postgresql://admin:admin@localhost:5433/realestate?schema=public
JWT_SECRET=replace-with-a-secret-of-at-least-32-characters
CORS_ORIGINS=http://localhost:3000
MEMCACHED_HOST=127.0.0.1
MEMCACHED_PORT=11212
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8109
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=xyz123
REDIS_HOST=localhost
REDIS_PORT=6379
OLLAMA_BASE_URL=http://127.0.0.1
OLLAMA_PORT=:11434
OLLAMA_MODEL=llama3.1:8b
```

The database URL and Typesense key above match the local Docker Compose
configuration. Use your own secret and do not use development credentials in
production. `JWT_SECRET` must contain at least 32 characters. Set
`CORS_ORIGINS` to a comma-separated allowlist of trusted frontend origins when
you deploy the API. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
`CLOUDINARY_API_SECRET` if you need to upload listing images.

Install dependencies, generate the Prisma client, apply migrations, and start
the API:

```bash
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm run start:dev
```

The API listens at `http://localhost:4000`. The static property uploads route
is served under `/uploads/`.

### Configure and start the web app

Create `web/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_API_COUNTRY=your-country-data-service-url
NEXT_PUBLIC_API_GOOGLE=your-calendar-integration-url
```

`NEXT_PUBLIC_API_URL` points to the local API. The country-data and calendar
integration URLs depend on the services you use.

Start the frontend in a separate terminal:

```bash
cd web
pnpm install
pnpm run dev
```

Open `http://localhost:3000`. The default locale is English; Spanish is also
available.

## Testing

Run the backend unit tests:

```bash
cd backend
pnpm test
```

Run the frontend lint check:

```bash
cd web
pnpm run lint
```

Run the Python API, browser, and AI/RAG tests from `qa-py/`:

```bash
cd qa-py
python -m pip install -r requirements.txt
pytest
```

The Python tests load configuration from `qa-py/.env`. Set `API_URL` to the
backend URL and, for browser tests, configure the frontend URL and test account
details required by the test fixtures. AI judge tests also use `OLLAMA_URL` and
`JUDGE_MODEL`. To run selected AI tests, use pytest markers such as
`pytest -m "contract or rag"`, `pytest -m hallucination`,
`pytest -m judge -s`, or `pytest -m latency -s`.

## Security and accessibility

The API requires JWT authentication for private operations, enforces ownership
and role checks, validates request bodies, applies rate limits, and uses
Helmet security headers. Public registration always assigns the user role.
Configure `JWT_SECRET` and `CORS_ORIGINS` for each environment, and use HTTPS
with production secrets when deploying.

The web interface includes keyboard-visible focus, labeled controls, a
skip-to-content link, and reduced-motion support. These improvements do not
replace a complete WCAG audit.

## Repository layout

```text
backend/        NestJS API, Prisma schema, and Docker Compose services
web/            Next.js application and English/Spanish translations
qa-py/          Python test suite and AI evaluation metrics
realestate-curl/ Bruno requests organized by API feature
```
