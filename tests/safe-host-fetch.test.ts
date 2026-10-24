import { describe, expect, it } from "vitest";
import {
  assertFixedRequest,
  isPublicAddress,
  resolvePublicHost,
} from "@/lib/safe-host-fetch";

describe("verified host network boundary", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "169.254.169.254",
    "192.168.1.1",
    "100.64.0.1",
    "::1",
    "fc00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "2001:db8::1",
  ])("blocks non-public address %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });
  it.each(["1.1.1.1", "8.8.8.8", "2606:4700:4700::1111"])(
    "allows public address %s",
    (address) => {
      expect(isPublicAddress(address)).toBe(true);
    },
  );
  it("rejects a mixed public/private DNS answer instead of selecting the public one", async () => {
    await expect(
      resolvePublicHost("staging.example.com", async () => [
        { address: "1.1.1.1", family: 4 },
        { address: "127.0.0.1", family: 4 },
      ]),
    ).rejects.toThrow("public addresses");
  });
  it("pins one validated public answer and rejects empty or malformed answers", async () => {
    expect(
      await resolvePublicHost("staging.example.com", async () => [
        { address: "1.1.1.1", family: 4 },
      ]),
    ).toEqual({ address: "1.1.1.1", family: 4 });
    await expect(
      resolvePublicHost("staging.example.com", async () => []),
    ).rejects.toThrow();
    await expect(
      resolvePublicHost("staging.example.com", async () => [
        { address: "not-an-ip", family: 4 },
      ]),
    ).rejects.toThrow();
  });
  it("allows only planned passive method/path combinations", () => {
    expect(() =>
      assertFixedRequest("/.well-known/agent-shielda.txt", "GET"),
    ).not.toThrow();
    expect(() => assertFixedRequest("/", "OPTIONS")).not.toThrow();
    expect(() => assertFixedRequest("/admin", "GET")).toThrow();
    expect(() =>
      assertFixedRequest("/.well-known/agent-shielda.txt", "OPTIONS"),
    ).toThrow();
    expect(() => assertFixedRequest("/", "POST")).toThrow();
  });
});

it("honours Node 22 all-address lookup requests without losing the validated pin", async () => {
  const { createPinnedLookup } = await import("@/lib/safe-host-fetch");
  const lookup = createPinnedLookup({ address: "1.1.1.1", family: 4 });
  const all = await new Promise((resolve) =>
    lookup("staging.example.com", { all: true }, (err, address, family) =>
      resolve({ err, address, family }),
    ),
  );
  expect(all).toEqual({
    err: null,
    address: [{ address: "1.1.1.1", family: 4 }],
    family: undefined,
  });
  const single = await new Promise((resolve) =>
    lookup("staging.example.com", {}, (err, address, family) =>
      resolve({ err, address, family }),
    ),
  );
  expect(single).toEqual({ err: null, address: "1.1.1.1", family: 4 });
});
