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

`test:e2e` (and the conversation integration suite,
`playwright test --config=playwright.integration.config.ts`) need a throwaway
**local** Postgres in `E2E_DATABASE_URL`; the tests refuse any non-localhost
database, and the dev server they start is pointed at that database — never at
`.env`'s `DATABASE_URL`:

```bash
export E2E_DATABASE_URL=postgresql://vehicle:vehicle@localhost:5432/pingmycar_test
DATABASE_URL=$E2E_DATABASE_URL pnpm db:deploy   # once
pnpm test:e2e
```

Owners are Google-only, and real Google OAuth can't run unattended, so tests
sign in through `tests/helpers/auth.ts`: it creates the state a successful
"Continue with Google" leaves (verified user + linked `google` account) and
mints a real signed session with Better Auth's `test-utils` plugin. That
plugin lives only in the test process's own auth instance — the app has no
test login endpoint and no bypass.

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
