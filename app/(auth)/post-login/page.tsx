import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { postLoginPath } from "@/lib/onboarding";

export default async function PostLoginPage() {
  const session = await requireSession();
  redirect(await postLoginPath(session.user.id));
}
