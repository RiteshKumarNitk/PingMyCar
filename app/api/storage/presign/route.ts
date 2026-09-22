import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { isStorageConfigured, presignUpload, privateObjectKey } from "@/lib/storage/s3";

const presignSchema = z.object({
  filename: z.string().trim().min(1).max(200),
  contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
});

/**
 * Mints a short-lived pre-signed PUT URL for the caller's own private
 * namespace. The browser uploads directly to object storage and never
 * receives (or needs) any credentials.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Object storage is not configured on this deployment." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  const { filename, contentType } = parsed.data;
  const key = privateObjectKey(session.user.id, `${Date.now()}-${filename}`);
  const uploadUrl = await presignUpload(key, contentType);
  if (!uploadUrl) {
    return NextResponse.json({ error: "Couldn't create the upload URL." }, { status: 500 });
  }

  return NextResponse.json({ uploadUrl, key, expiresIn: 300 }, { status: 201 });
}
