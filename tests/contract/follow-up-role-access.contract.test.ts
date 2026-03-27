import { describe, expect, it } from "vitest";

import { canReadFollowUp, canWriteFollowUp } from "@/lib/auth/role-scopes";

import { createRoleAssignment, createSessionUser } from "../helpers/session-user";

describe("follow-up role access contract", () => {
  const context = {
    collectorUserId: "collector-1",
    createdBy: "collector-1",
    projectId: "project-parco",
  };

  it("allows managers to read and update all follow-ups", () => {
    const manager = createSessionUser({ roles: [createRoleAssignment("manager", "project-parco")] });

    expect(canReadFollowUp(manager, context)).toBe(true);
    expect(canWriteFollowUp(manager, context)).toBe(true);
  });

  it("limits collectors to their own follow-ups", () => {
    const ownCollector = createSessionUser({
      id: "collector-1",
      roles: [createRoleAssignment("collector", "project-parco")],
    });
    const otherCollector = createSessionUser({
      id: "collector-2",
      roles: [createRoleAssignment("collector", "project-parco")],
    });

    expect(canWriteFollowUp(ownCollector, context)).toBe(true);
    expect(canWriteFollowUp(otherCollector, context)).toBe(false);
  });

  it("keeps viewers read-only", () => {
    const viewer = createSessionUser({ roles: [createRoleAssignment("viewer", "project-parco")] });

    expect(canReadFollowUp(viewer, context)).toBe(true);
    expect(canWriteFollowUp(viewer, context)).toBe(false);
  });
});
