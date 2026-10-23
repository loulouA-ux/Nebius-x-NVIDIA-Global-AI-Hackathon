import { EventEmitter } from "node:events";
import { describe, it, expect, vi } from "vitest";
const transport = vi.hoisted(() => ({
  status: 200,
  body: "ok",
  request: vi.fn(),
  options: {} as Record<string, unknown>,
}));
vi.mock("node:https", () => ({
  request: (
    options: Record<string, unknown>,
    callback: (r: unknown) => void,
  ) => {
    transport.request();
    transport.options = options;
    const req = new EventEmitter() as EventEmitter & { end: () => void };
    req.end = () => {
      const res = new EventEmitter() as EventEmitter & {
        statusCode: number;
        headers: Record<string, string>;
        destroy: (e?: Error) => void;
      };
      res.statusCode = transport.status;
      res.headers = {};
      res.destroy = (e) => {
        if (e) res.emit("error", e);
      };
      callback(res);
      if (transport.status < 300) {
        res.emit("data", Buffer.from(transport.body));
        res.emit("end");
      }
    };
    return req;
  },
}));
import { fetchVerifiedPath } from "../src/lib/safe-host-fetch";
const resolver = async () => [{ address: "1.1.1.1", family: 4 as const }];
describe("HTTPS transport restrictions", () => {
  it("rejects redirects instead of following another location", async () => {
    transport.request.mockClear();
    transport.status = 302;
    transport.body = "";
    await expect(
      fetchVerifiedPath("staging.example.com", "/", "GET", resolver),
    ).rejects.toThrow("Redirects");
    expect(transport.request).toHaveBeenCalledTimes(1);
  });
  it("rejects response bodies above 64 KiB", async () => {
    transport.status = 200;
    transport.body = "x".repeat(65537);
    await expect(
      fetchVerifiedPath("staging.example.com", "/", "GET", resolver),
    ).rejects.toThrow("64 KB");
  });
  it("keeps TLS hostname and certificate checks while pinning the socket DNS callback", async () => {
    transport.status = 200;
    transport.body = "ok";
    await expect(
      fetchVerifiedPath("staging.example.com", "/", "GET", resolver),
    ).resolves.toMatchObject({ status: 200, body: "ok" });
    expect(transport.options).toMatchObject({
      hostname: "staging.example.com",
      servername: "staging.example.com",
      rejectUnauthorized: true,
    });
    expect(transport.options.signal).toBeInstanceOf(AbortSignal);
    const lookup = transport.options.lookup as Function;
    const addresses = await new Promise((resolve) =>
      lookup("staging.example.com", { all: true }, (_e: unknown, a: unknown) =>
        resolve(a),
      ),
    );
    expect(addresses).toEqual([{ address: "1.1.1.1", family: 4 }]);
  });
});
