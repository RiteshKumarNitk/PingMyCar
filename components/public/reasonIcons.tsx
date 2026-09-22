import {
  Lightbulb,
  CarFront,
  DoorOpen,
  Wrench,
  TriangleAlert,
  ShieldAlert,
  Siren,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import type { ContactReasonId } from "@/types";

export const REASON_ICONS: Record<ContactReasonId, LucideIcon> = {
  LIGHTS_ON: Lightbulb,
  MOVE_VEHICLE: CarFront,
  DOOR_OPEN: DoorOpen,
  VEHICLE_ISSUE: Wrench,
  DAMAGE: TriangleAlert,
  SECURITY: ShieldAlert,
  URGENT: Siren,
  OTHER: MessageCircle,
};
