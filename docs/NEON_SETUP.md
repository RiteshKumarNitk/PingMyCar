# Neon Project Setup & Integration Guide

This guide details the Neon Serverless Postgres, S3-compatible storage, Neon Auth, and Neon Functions configuration for **PingMyCar**.

---

## 1. Project Information

- **Project ID**: `aged-tree-33611077`
- **Branch**: `production`
- **Region**: `ap-southeast-1`

---

## 2. Installed Dependencies

The following packages have been installed for Neon integration and S3 storage:

```bash
pnpm add @neon/config @aws-sdk/client-s3 @aws-sdk/s3-request-presigner dotenv
```

Global Neon CLI:
```bash
npm i -g neon@latest
```

---

## 3. Environment Variables Configuration

Add the following entries to your [`.env`](../.env) file:

```env
# PostgreSQL (Neon Database)
DATABASE_URL="postgresql://neondb_owner:npg_IJPymcZzA63b@ep-still-hill-b31pwem0-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Neon S3-compatible Storage
AWS_ENDPOINT_URL_S3="https://br-holy-leaf-b3tb762j.storage.c-4.ap-southeast-1.aws.neon.tech"
AWS_ACCESS_KEY_ID="nak_live_177aeb527bf042c6bead3271f348b603"
AWS_SECRET_ACCESS_KEY="nsk_live_e6be6bb34484ca4c9a1fd1e9cb64918309ccbce31cff6f8729c0d7f808317ad2"
AWS_REGION="ap-southeast-1"

# Neon Auth
NEON_AUTH_URL="https://ep-still-hill-b31pwem0.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth"
NEON_JWKS_URL="https://ep-still-hill-b31pwem0.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth/.well-known/jwks.json"
```

---

## 4. Configuration Files

### `neon.ts`
Located at the root of the project:

```ts
import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: true,
  preview: {
    // Upgrade to a paid plan to enable AI Gateway for your project.
    // aiGateway: true,
    buckets: {
      userprofile: { access: "private" },
    },
    functions: {
      api: { name: "api", source: "./hello.ts" },
    },
  },
});
```

### `hello.ts`
Sample Neon Function endpoint:

```ts
export default async function hello(): Promise<Response> {
  return new Response("Hello from Neon Functions");
}
```

---

## 5. Step-by-Step CLI Setup

Run the following commands in your terminal to complete the setup and deployment:

```bash
# Step 1: Log in to your Neon account (opens browser)
neon login

# Step 2: Set up Neon Agent Skills
neon skills -y

# Step 3: Set up Model Context Protocol (MCP)
neon mcp -y

# Step 4: Link your local workspace to the Neon project
neon link --project-id aged-tree-33611077 --branch production -y

# Step 5: Initialize config
neon config init

# Step 6: Deploy Neon functions & resources
neon deploy
```

---

## 6. Database Migrations with Prisma

To apply your Prisma schema migrations to the remote Neon PostgreSQL database:

```bash
# Push schema directly
pnpm prisma db push

# Or apply existing migrations
pnpm prisma migrate deploy
```
