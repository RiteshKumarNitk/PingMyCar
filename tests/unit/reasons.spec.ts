import { test, expect } from "@playwright/test";
import { visibleReasons } from "@/types";

test.describe("visibleReasons", () => {
  test("returns nothing when allowMessages is off, regardless of other flags", () => {
    const result = visibleReasons({
      allowMessages: false,
      allowParkingAlerts: true,
      allowVehicleIssues: true,
      allowDamageReports: true,
      allowEmergencyAlerts: true,
    });
    expect(result).toEqual([]);
  });

  test("OTHER is always included once messaging is on, even with every category off", () => {
    const result = visibleReasons({
      allowMessages: true,
      allowParkingAlerts: false,
      allowVehicleIssues: false,
      allowDamageReports: false,
      allowEmergencyAlerts: false,
    });
    expect(result.map((r) => r.id)).toEqual(["OTHER"]);
  });

  test("allowParkingAlerts gates LIGHTS_ON, MOVE_VEHICLE, and DOOR_OPEN together", () => {
    const result = visibleReasons({
      allowMessages: true,
      allowParkingAlerts: true,
      allowVehicleIssues: false,
      allowDamageReports: false,
      allowEmergencyAlerts: false,
    });
    expect(result.map((r) => r.id).sort()).toEqual(["DOOR_OPEN", "LIGHTS_ON", "MOVE_VEHICLE", "OTHER"].sort());
  });

  test("allowEmergencyAlerts gates both SECURITY and URGENT", () => {
    const result = visibleReasons({
      allowMessages: true,
      allowParkingAlerts: false,
      allowVehicleIssues: false,
      allowDamageReports: false,
      allowEmergencyAlerts: true,
    });
    expect(result.map((r) => r.id).sort()).toEqual(["OTHER", "SECURITY", "URGENT"].sort());
  });

  test("every flag on returns all 8 reasons", () => {
    const result = visibleReasons({
      allowMessages: true,
      allowParkingAlerts: true,
      allowVehicleIssues: true,
      allowDamageReports: true,
      allowEmergencyAlerts: true,
    });
    expect(result).toHaveLength(8);
  });
});
