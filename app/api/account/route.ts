import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AccountDeletionRefused, deleteOwnerAccount } from "@/lib/account/deletion";
import { auditContext, writeAudit } from "@/lib/admin/audit";

/**
 * DELETE /api/account — the signed-in owner permanently deletes their own
 * account (see lib/account/deletion.ts for exactly what is removed/kept).
 *
 * The account is always the session's user — there is no id in the request.
 * Works for the web (cookie) and the app (bearer token). The session is only
 * ended AFTER the deletion commits, so a failure leaves the owner signed in
 * and able to retry.
 */

// better-auth's default cookie names (no custom prefix is configured).
const SESSION_COOKIES = ["better-auth.session_token", "better-auth.session_data", "better-auth.dont_remember"];

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const context = await auditContext();

  try {
    const result = await deleteOwnerAccount(userId);
    await writeAudit({
      action: "ACCOUNT_DELETED_BY_OWNER",
      category: "SECURITY",
      actorType: "USER",
      actorId: result.hardDelete ? null : userId,
      resourceType: "USER",
      resourceId: userId,
      metadata: { count: result.vehiclesDeleted, action: result.hardDelete ? "hard_delete" : "anonymized_for_open_reports" },
      context,
    });

    const res = NextResponse.json({ ok: true });
    for (const name of SESSION_COOKIES) {
      res.cookies.set(name, "", { maxAge: 0, path: "/" });
      res.cookies.set(`__Secure-${name}`, "", { maxAge: 0, path: "/", secure: true });
    }
    return res;
  } catch (err) {
    if (err instanceof AccountDeletionRefused) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[account] deletion failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "We couldn't delete your account. Please try again." }, { status: 500 });
  }
}
