import type { Metadata } from "next";
import { PublicVehicleScreen } from "@/components/public/PublicVehicleScreen";

export const metadata: Metadata = {
  title: "Contact This Vehicle",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function VehicleQrCodePage({
  params,
}: {
  params: Promise<{ qrCode: string }>;
}) {
  const { qrCode } = await params;
  return <PublicVehicleScreen token={qrCode} />;
}
