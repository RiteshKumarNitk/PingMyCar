import { redirect } from "next/navigation";

export default function DashboardPage() {
  // The layout above already guarantees onboarding is complete (real name +
  // at least one vehicle) before this page can render.
  redirect("/dashboard/vehicles");
}
