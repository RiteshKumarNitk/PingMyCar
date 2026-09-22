import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isStorageConfigured, presignDownload } from "@/lib/storage/s3";

/**
 * Signed read for a private object. The requested key must live inside the
 * caller's own namespace — users can never mint URLs for other users' files.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "Object storage is not configured." }, { status: 503 });
  }

  const key = request.nextUrl.searchParams.get("key");
  if (!key || !key.startsWith(`userprofile/${session.user.id}/`)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const url = await presignDownload(key, 60);
  if (!url) return NextResponse.json({ error: "Couldn't sign the URL." }, { status: 500 });

  return NextResponse.json({ url, expiresIn: 60 });
}
