import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/lib/server/http";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  database: vi.fn(),
  requireActor: vi.fn(),
  getScan: vi.fn(),
  decisions: vi.fn(),
  quota: vi.fn(),
  decide: vi.fn(),
}));
vi.mock("@/lib/server/db", () => ({ database: mocks.database }));
vi.mock("@/lib/server/session", () => ({ requireActor: mocks.requireActor }));
vi.mock("@/lib/server/store", () => ({
  Store: class {
    getScan = mocks.getScan;
    decisions = mocks.decisions;
    quota = mocks.quota;
    decide = mocks.decide;
  },
}));
import { GET } from "../src/app/api/scans/[id]/route";
import { POST } from "../src/app/api/scans/[id]/decisions/route";

const actor = { id: "peter", workspaceId: "shipcheck-team", role: "member" };
const scanId = "12345678-abcd-4321-abcd-123456789abc";
function invoke(method: "GET" | "POST", id: string) {
  const request = new Request(`https://app.example/api/scans/${encodeURIComponent(id)}${method === "POST" ? "/decisions" : ""}`, {
    method,
    ...(method === "POST" ? { body: JSON.stringify({ findingId: "finding-1", action: "acknowledge" }) } : {}),
  });
  return (method === "GET" ? GET : POST)(request, { params: Promise.resolve({ id }) });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.database.mockReturnValue(mocks.query);
  mocks.requireActor.mockResolvedValue(actor);
  mocks.getScan.mockResolvedValue({ id: scanId });
  mocks.decisions.mockResolvedValue([]);
  mocks.decide.mockResolvedValue({ id: "decision-1" });
});

describe("scan route UUID boundary", () => {
  const malformed = [
    "-".repeat(36),
    "a".repeat(36),
    "1234567-abcd-4321-abcd-123456789abcd",
    "12345678-abcd-4321-abcd-123456789abg",
    scanId + "\n",
    " " + scanId,
    "",
  ];
  for (const method of ["GET", "POST"] as const) {
    it.each(malformed)(`${method} rejects malformed ID %j before database/auth/store access`, async (id) => {
      const response = await invoke(method, id);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid scan ID." });
      expect(mocks.database).not.toHaveBeenCalled();
      expect(mocks.requireActor).not.toHaveBeenCalled();
      expect(mocks.getScan).not.toHaveBeenCalled();
      expect(mocks.decisions).not.toHaveBeenCalled();
      expect(mocks.decide).not.toHaveBeenCalled();
      expect(mocks.quota).not.toHaveBeenCalled();
    });
    it.each([scanId, scanId.toUpperCase()])(`${method} accepts canonical ID %s and retains the authenticated actor`, async (id) => {
      const response = await invoke(method, id);
      expect(response.status).toBe(method === "GET" ? 200 : 201);
      expect(mocks.requireActor).toHaveBeenCalledWith(expect.any(Request), mocks.query);
      if (method === "GET") {
        expect(mocks.getScan).toHaveBeenCalledWith(actor, id);
        expect(mocks.decisions).toHaveBeenCalledWith(actor, id);
      } else {
        expect(mocks.decide).toHaveBeenCalledWith(actor, id, "finding-1", "acknowledge", "");
      }
    });
    it(`${method} still rejects a valid ID without a member session`, async () => {
      mocks.requireActor.mockRejectedValue(new ApiError(401, "Member sign-in required."));
      expect((await invoke(method, scanId)).status).toBe(401);
      expect(mocks.getScan).not.toHaveBeenCalled();
      expect(mocks.decide).not.toHaveBeenCalled();
    });
    it(`${method} preserves owner-scope not-found responses`, async () => {
      mocks.getScan.mockRejectedValue(new ApiError(404, "Scan not found."));
      mocks.decide.mockRejectedValue(new ApiError(404, "Scan not found."));
      const response = await invoke(method, scanId);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Scan not found." });
    });
  }
});
