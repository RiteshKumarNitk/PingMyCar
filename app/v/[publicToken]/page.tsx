import type { Metadata } from "next";
import { PublicVehicleScreen } from "@/components/public/PublicVehicleScreen";

export const metadata: Metadata = {
  title: "Contact This Vehicle",
  robots: { index: false },
};

// A scan must always reflect the live QR state (active/inactive, current
// visibility toggles) — never a cached render.
export const dynamic = "force-dynamic";

export default async function PublicVehiclePage({
  params,
}: {
  params: Promise<{ publicToken: string }>;
}) {
  const { publicToken } = await params;
  return <PublicVehicleScreen token={publicToken} />;
}
