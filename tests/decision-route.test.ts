import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  database: vi.fn(),
  requireActor: vi.fn(),
  quota: vi.fn(),
  decide: vi.fn(),
}));
vi.mock("@/lib/server/db", () => ({ database: mocks.database }));
vi.mock("@/lib/server/session", () => ({ requireActor: mocks.requireActor }));
vi.mock("@/lib/server/store", () => ({
  Store: class {
    quota = mocks.quota;
    decide = mocks.decide;
  },
}));
import { POST } from "../src/app/api/scans/[id]/decisions/route";

const scanId = "621112ad-1e49-4f6e-8d16-89a6a75b49ec";
const actor = { id: "peter", workspaceId: "shipcheck-team", role: "member" };
function post(input: Record<string, unknown>) {
  return POST(
    new Request(`https://shipcheck.example/api/scans/${scanId}/decisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ findingId: "finding-1", ...input }),
    }),
    { params: Promise.resolve({ id: scanId }) },
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireActor.mockResolvedValue(actor);
  mocks.quota.mockResolvedValue(undefined);
  mocks.decide.mockResolvedValue({ id: "decision-1" });
});
describe("decision API dismissal validation", () => {
  it.each([undefined, "", "   ", "\t\n\r", "\u00a0"])(
    "rejects a missing or blank dismissal reason (%j) before persistence",
    async (reason) => {
      const response = await post({ action: "dismiss", reason });
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid decision." });
      expect(mocks.database).not.toHaveBeenCalled();
      expect(mocks.decide).not.toHaveBeenCalled();
    },
  );
  it("persists a trimmed nonblank dismissal reason with the authenticated actor", async () => {
    const response = await post({ action: "dismiss", reason: "  Not reachable in this deployment.\n" });
    expect(response.status).toBe(201);
    expect(mocks.decide).toHaveBeenCalledWith(actor, scanId, "finding-1", "dismiss", "Not reachable in this deployment.");
  });
  it("keeps acknowledgements without reasons valid", async () => {
    const response = await post({ action: "acknowledge" });
    expect(response.status).toBe(201);
    expect(mocks.decide).toHaveBeenCalledWith(actor, scanId, "finding-1", "acknowledge", "");
  });
  it("preserves optional acknowledgement notes", async () => {
    const response = await post({ action: "acknowledge", reason: " Reviewed by owner. " });
    expect(response.status).toBe(201);
    expect(mocks.decide).toHaveBeenCalledWith(actor, scanId, "finding-1", "acknowledge", " Reviewed by owner. ");
  });
  it.each([null, 42, "a".repeat(1001)])("rejects invalid or overlong reason input", async (reason) => {
    const response = await post({ action: "dismiss", reason });
    expect(response.status).toBe(400);
    expect(mocks.decide).not.toHaveBeenCalled();
  });
});
