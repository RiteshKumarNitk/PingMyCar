# PingMyCar — MVP Architecture

A privacy-first **vehicle contact profile**. The QR sticker is only the physical entry point. The product is owner-controlled public information + anonymous messaging.

This document is the source of truth for Phases 1–14. Flutter (Phase 15) is out of scope until the web MVP is stable.

---

## Conflicts and missing decisions (resolved)

| Topic | Tension | Decision |
|---|---|---|
| Auth | Spec wants phone + OTP. Better Auth is already in the stack and typically uses email. | **Better Auth** in one Next.js app. Phase 3: phone OTP as the owner signup path. Email stays on `User` for Better Auth + later alerts, and is **never public**. Dev fallback: email OTP / password only if SMS is not configured. |
| Product name | Repo is PingMyCar; landing currently says CarPing. | **PingMyCar** is the product name. Unify marketing copy in Phase 2. |
| Public IDs | Spec forbids database IDs in public URLs. Dashboard uses `/dashboard/messages/[id]`. | Public: `/v/[publicToken]`, `/c/[visitorToken]`. Owner dashboard IDs are session-gated UUIDs, never given to visitors. |
| Visitor token storage | Spec lists `visitorToken` on Conversation. Storing raw tokens in Postgres leaks conversation URLs if the DB is dumped. | Store **SHA-256 hash only** (`visitorTokenHash`). Raw token is shown once to the visitor. |
| Rate limiting | Spec wants limits without Redis. | In-process limiter (single Node instance). Configurable via env. Revisit Redis only if we run multiple app instances. |
| Photos | Spec allows Cloudinary later. | `photoUrl` string on Vehicle / User. No Cloudinary in MVP. Optional local/remote URL later. |
| Call / WhatsApp | Contact settings include them, but they must stay off and unimplemented. | Boolean flags on `VehicleProfile`, default **false**. No telephony, no WhatsApp API. |
| Emergency | Category vs emergency service. | `URGENT` / emergency alert is a **message reason**, plus a visible disclaimer to use local emergency numbers. No SOS routing. |
| Encryption at rest | Older notes mentioned encrypting registration numbers. Spec does not require it. | Do **not** encrypt in MVP. Never return registration unless `showRegistrationNumber` is true. |
| Existing landing | Repo already has marketing UI (Phase 2 content). | Keep it in `app/(marketing)` as-is. Do not expand it until Phase 2 is approved. |
| FCM | In the stack, Flutter is later. | `Device` table now. Web push / FCM send in Phase 12. Flutter consumes the same APIs later. |

---

## 1. Final architecture

One Next.js 15 App Router application. One PostgreSQL database. Prisma. pnpm.

```text
Internet
   │
   ▼
Nginx (TLS / reverse proxy in production)
   │
   ▼
Next.js (website + API routes)
   │
   ├── Marketing, auth, dashboard (owners, browser)
   ├── Public profile  /v/[publicToken]  (visitors, no account)
   ├── Conversation    /c/[visitorToken] (visitors, no account)
   └── Prisma ──► PostgreSQL
```

Future Flutter owner app talks to the same `/api/*` routes. Visitors never need an app.

**Not used in MVP:** NestJS, Redis, queues, Kafka, Kubernetes, GraphQL, WebSockets, separate notification/media services.

---

## 2. Database ER diagram

```text
User 1──* Vehicle 1──1 VehicleProfile
  │            │
  │            └──* Conversation 1──* Message
  └──* Device

Better Auth (same DB): Session, Account, Verification
```

```text
User
  id PK
  name, email, emailVerified, image
  phone? UNIQUE
  preferredName?
  createdAt, updatedAt

Vehicle
  id PK
  ownerId FK User
  type?
  name
  registrationNumber?     -- private unless profile flag
  photoUrl?
  publicToken UNIQUE      -- QR payload only
  qrActive
  createdAt, updatedAt

VehicleProfile
  id PK
  vehicleId UNIQUE FK
  showVehicleName / Type / Photo / RegistrationNumber
  showOwnerName / OwnerPhoto / PreferredName
  allowMessages, allowParkingAlerts, allowVehicleIssues,
  allowDamageReports, allowEmergencyAlerts
  allowCallRequest, allowWhatsApp          -- stored, unused

Conversation
  id PK
  vehicleId FK
  visitorTokenHash UNIQUE
  reason (first contact)
  status OPEN | CLOSED | BLOCKED
  expiresAt
  createdAt, updatedAt

Message
  id PK
  conversationId FK
  senderType VISITOR | OWNER
  reason?
  body
  createdAt

Device
  id PK
  userId FK
  fcmToken
  platform WEB | ANDROID | IOS
  createdAt
```

**Later (Phase 13+), not now:** Report, BlockedConversation, AuditLog, Subscription.

---

## 3. Prisma schema

Canonical file: `prisma/schema.prisma`.

Defaults that encode product privacy:

- Vehicle fields the owner typically wants on a sticker: name/type/photo **visible**.
- Registration number **hidden**.
- All owner identity fields **hidden**.
- Anonymous messages and standard alerts **on**.
- Call request and WhatsApp **off**.

---

## 4. User flows

### Owner (web)

```text
Landing → Get Your QR → Phone OTP (Phase 3)
  → Add vehicle → Contact profile + live preview
  → Activate QR → Download / print
  → Dashboard inbox → Reply (no visitor identity)
```

### Visitor (browser only)

```text
Sticker → camera → /v/[publicToken]
  → only owner-approved fields
  → tap reason → optional message → Send
  → /c/[visitorToken] for follow-up
```

No install, no account, no phone/email required from the visitor.

---

## 5. Page structure

```text
app/
  (marketing)/          /                 landing
  (auth)/               /login /signup    Phase 3
  dashboard/            /dashboard/*      Phases 4–11
  v/[publicToken]/      public profile    Phase 8
  c/[visitorToken]/     visitor thread    Phases 9–10
  api/                  JSON + auth       throughout
```

Owner dashboard (Phase 4+):

```text
/dashboard
/dashboard/vehicles
/dashboard/vehicles/new
/dashboard/vehicles/[id]
/dashboard/vehicles/[id]/profile
/dashboard/messages
/dashboard/messages/[id]
/dashboard/settings
```

---

## 6. API structure

All JSON. Zod validation. No GraphQL.

**Public (no session)**

| Method | Path | Purpose |
|---|---|---|
| GET | `/v/:publicToken` | HTML profile (not JSON) |
| POST | `/api/public/messages` | Start conversation |
| GET | `/api/public/conversations/:visitorToken` | Thread for that token only |
| POST | `/api/public/conversations/:visitorToken` | Visitor reply |
| POST | `/api/public/conversations/:visitorToken/report` | Abuse report (Phase 13) |

**Owner (session)**

| Method | Path | Purpose |
|---|---|---|
| `*` | `/api/auth/*` | Better Auth |
| GET/POST | `/api/vehicles` | List / create |
| GET/PATCH/DELETE | `/api/vehicles/:id` | Manage + QR active/regenerate |
| GET/PATCH | `/api/vehicles/:id/profile` | Visibility + contact settings |
| GET | `/api/messages` | Inbox |
| GET | `/api/conversations/:id` | Owner thread |
| POST | `/api/conversations/:id/reply` | Owner reply |
| POST | `/api/conversations/:id/block` | Block |
| POST | `/api/devices` | Register FCM token (Phase 12) |

Public responses **must not** include `ownerId`, email, phone, user id, or hidden profile fields. Unknown tokens return generic 404.

---

## 7. Security model

- Cryptographically random `publicToken` (short Crockford-style alphabet for stickers) and visitor tokens (`base64url` 32 bytes).
- Visitor access = possession of the conversation token. Tokens are not enumerable.
- Owner access = Better Auth session cookie (`httpOnly`, `secure` in production, `sameSite=lax`).
- Authorization: vehicle and conversation rows always scoped to `session.user.id`.
- Input: Zod; message max length env (`MESSAGE_MAX_CHARS`, default 500).
- Rate limit (Phase 13, config now): `RATE_LIMIT_VISITOR_PER_MINUTE` default 5, keyed by visitor token or IP hash — **never log raw IPs, tokens, or PII**.
- HTTPS at Nginx. No secrets in the client except `NEXT_PUBLIC_APP_URL` and optional Turnstile site key later.
- Deactivate QR: public page shows inactive, cannot start new threads. Existing threads remain until expiry/block.
- Regenerate QR: new `publicToken`; old sticker URLs 404.

---

## 8. Development plan

| Phase | Scope | Status |
|---|---|---|
| 1 | Next.js, TS, Tailwind, shadcn, pnpm, Prisma, Postgres, Docker, Nginx | **this change** |
| 2 | Landing page | already drafted — wait for approval to iterate |
| 3 | Owner authentication (phone OTP) | not started |
| 4 | Vehicle management | not started |
| 5 | Contact profile builder | not started |
| 6 | Live public preview | not started |
| 7 | QR generate / download / activate | not started |
| 8 | Public `/v/[token]` page | not started |
| 9 | Anonymous visitor session | not started |
| 10 | Messaging | not started |
| 11 | Owner inbox + replies | not started |
| 12 | Email + browser/FCM notifications | not started |
| 13 | Rate limit, report, block | not started |
| 14 | Production deploy (Docker + Nginx) | not started |
| 15 | Flutter owner app | **after** web MVP |

Stop after each major phase and wait for approval.
