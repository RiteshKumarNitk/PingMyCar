import { NextRequest, NextResponse } from "next/server";
import { getLastOtp } from "@/lib/auth/otpStore";

/** Dev/test only — never reachable when built for production. */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const phoneNumber = request.nextUrl.searchParams.get("phoneNumber");
  if (!phoneNumber) {
    return NextResponse.json({ error: "phoneNumber query param required" }, { status: 400 });
  }

  const code = getLastOtp(phoneNumber);
  if (!code) return NextResponse.json({ error: "No OTP sent to that number yet" }, { status: 404 });

  return NextResponse.json({ code });
}
