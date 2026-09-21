# PingMyCar

A customizable **private contact profile** for every vehicle. A QR sticker is only the entry point. Visitors never see the owner's phone number or email, and they never install an app.

Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma 6 · PostgreSQL 17 · pnpm · Docker · Nginx

## Phase status

Phase 1 (foundation) is in progress. Owner auth, vehicles, public QR, and messaging are **not** implemented yet.

## Local development

```bash
pnpm install
pnpm db:up
pnpm db:migrate
pnpm dev
```

App: http://localhost:3100  
Health: http://localhost:3100/api/health

Copy `.env.example` to `.env` and set `AUTH_SECRET` (and matching `BETTER_AUTH_SECRET`).

`NEXT_PUBLIC_APP_URL` must be the real public origin **before printing stickers**.

## Docker

```bash
docker compose up -d postgres
# production-style stack (app + postgres):
# docker compose up --build
```

Nginx sits in front of the app when you enable the `prod` profile:

```bash
docker compose --profile prod up --build
```

## Product principle

Do not build another generic “scan QR to call the owner” tool.

Build: vehicle → private contact profile → owner-controlled visibility → owner-controlled contact reasons → anonymous relay.
