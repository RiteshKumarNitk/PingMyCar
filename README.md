# PingMyCar

A customizable **private contact profile** for every vehicle. A QR sticker is only the entry point. Visitors never see the owner's phone number or email, and they never install an app.

Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma 6 · PostgreSQL 17 · pnpm · Docker · Nginx

## Phase status

Phases 1–13 are done: landing page, phone-OTP auth, vehicle management, contact-profile builder with live preview, QR generate/download/activate, the public vehicle page, anonymous visitor messaging, the owner inbox, email/browser-push notifications, and report/block. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full phase table. Flutter (Phase 15) is out of scope until the web MVP is stable.

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

### Seeded logins (`pnpm db:seed`)

Open `/login` → **Staff / email sign-in**.

| Role | Email | Password |
|---|---|---|
| Super admin | `admin@pingmycar.test` | `SuperAdmin!234` |
| Demo owner | `demo@pingmycar.test` | `demopass123` |

Super admin lands on `/admin` and can open Users, Vehicles, Messages, and Stickers to inspect owner activity. Change this password before any public deploy.

## Testing

```bash
pnpm test:unit   # pure logic — no browser, no dev server, no DB (~2s)
pnpm test:e2e    # full browser flows against a real dev server + Postgres
pnpm test        # both, in order
```

`test:e2e` starts its own `pnpm dev` if one isn't already running on :3100 (reuses
it otherwise) and talks to whatever Postgres `DATABASE_URL` points at — same DB
as local dev. Each test creates its own uniquely-numbered phone/user and cleans
up after itself in `afterEach`, but it's still the dev DB: don't point `test:e2e`
at a database with data you care about.

OTP codes are read via `GET /api/test/last-otp?phoneNumber=...`, a dev-only
route (404s when `NODE_ENV=production`) that reflects whatever the console-log
dev fallback last sent — no need to scrape server output.

## Docker

```bash
docker compose up -d postgres
# full stack (postgres + migrations + app):
# docker compose up --build
```

`migrate` runs `prisma migrate deploy` once and exits before `web` starts — `web` won't start until it succeeds. It re-runs safely on every `up` (no-op if there's nothing pending).

Nginx sits in front of the app when you enable the `prod` profile:

```bash
docker compose --profile prod up --build
```

### Production environment variables

Set these in the shell (or an `.env` file `docker compose` reads) before `docker compose up`:

| Variable | Required | Notes |
|---|---|---|
| `AUTH_SECRET` | yes | `openssl rand -base64 32`. Used for both `AUTH_SECRET` and `BETTER_AUTH_SECRET`. |
| `NEXT_PUBLIC_APP_URL` | yes | The real public origin — this is what gets encoded into every QR sticker. Get it right before printing any. |
| `RESEND_API_KEY` / `ALERT_EMAIL_FROM` | no | Without these, owner notifications log to the container's stdout instead of sending. |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | no | Browser push is inert without these. Generate your own with `npx web-push generate-vapid-keys` — don't reuse the dev pair in `.env.example`. |
| `MESSAGE_MAX_CHARS` / `RATE_LIMIT_VISITOR_PER_MINUTE` | no | Defaults to `500` / `5`. |

### TLS

`nginx/nginx.conf` is HTTP-only — it expects TLS to be terminated in front of it (a cloud load balancer, Cloudflare, or a certbot-managed proxy). This wasn't built or tested here since it needs a real public domain to issue a certificate against. If you're terminating TLS on this same box, the common path is `certbot --nginx` against this config, or fronting it with a managed load balancer that already speaks HTTPS.

## Product principle

Do not build another generic “scan QR to call the owner” tool.

Build: vehicle → private contact profile → owner-controlled visibility → owner-controlled contact reasons → anonymous relay.
