import { test, expect } from "@playwright/test";
import { planAccountDeletion } from "@/lib/account/deletion";

test.describe("account deletion plan", () => {
  test("no open reports → the whole account is hard-deleted", () => {
    const plan = planAccountDeletion([
      { id: "v1", conversations: [{ id: "c1", openReports: 0 }, { id: "c2", openReports: 0 }] },
      { id: "v2", conversations: [] },
    ]);
    expect(plan.hardDelete).toBe(true);
    expect(plan.deleteVehicleIds).toEqual(["v1", "v2"]);
    expect(plan.keepVehicleIds).toEqual([]);
    expect(plan.keepConversationIds).toEqual([]);
  });

  test("an open report keeps only that conversation and its (wiped) vehicle", () => {
    const plan = planAccountDeletion([
      { id: "v1", conversations: [{ id: "c1", openReports: 1 }, { id: "c2", openReports: 0 }] },
      { id: "v2", conversations: [{ id: "c3", openReports: 0 }] },
    ]);
    expect(plan.hardDelete).toBe(false);
    expect(plan.keepVehicleIds).toEqual(["v1"]);
    expect(plan.keepConversationIds).toEqual(["c1"]); // c2 is deleted
    expect(plan.deleteVehicleIds).toEqual(["v2"]);
  });

  test("an owner with no vehicles is hard-deleted", () => {
    expect(planAccountDeletion([]).hardDelete).toBe(true);
  });
});
