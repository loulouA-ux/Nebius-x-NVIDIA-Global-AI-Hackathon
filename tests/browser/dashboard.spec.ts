import { test, expect } from "@playwright/test";
test("demo runs real findings, exposes evidence and manual actions", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ready for your next release?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await expect(
    page.getByRole("heading", { name: "2 blockers need attention" }),
  ).toBeVisible();
  await expect(
    page.getByText("Single-advisory snapshot retrieved 23 Oct 2026.", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Command Injection in lodash/ })
    .click();
  await page.getByRole("button", {name:"Preview source"}).click();
  await expect(
    page.getByRole("link", { name: "Open original source in a new tab" }),
  ).toHaveAttribute(
    "href",
    "https://osv.dev/vulnerability/GHSA-35jh-r3h4-6jhm",
  );
  await page.getByRole("button", {name:"Close",exact:true}).click();
  await expect(
    page.getByText("No code has been changed.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Recommended actions", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Work through the findings" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/actions-desktop.png",
    fullPage: true,
  });
});
test("anonymous live scan is blocked before manifest processing", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "New scan", exact: true })
    .first()
    .click();
  await page.getByLabel("Manifest content").fill("{bad json");
  await page
    .getByRole("button", { name: "Scan manifest", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Sign in to run live scans." }),
  ).toBeVisible();
});
test("mobile flow has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await expect(
    page.getByRole("heading", { name: "2 blockers need attention" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/report-mobile.png",
    fullPage: true,
  });
});
test("desktop overview renders without client errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/welcome-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await expect(
    page.getByRole("heading", { name: "2 blockers need attention" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/report-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("sign-in form rejects an invalid key without exposing it", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await page.getByLabel("Individual access key").fill("invalid-test-key");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Invalid access key.",
  );
  await expect(page.getByRole("main").getByRole("alert")).not.toContainText(
    "invalid-test-key",
  );
  await page.screenshot({ path: "test-results/sign-in.png", fullPage: true });
});

test("member can reopen a saved report and record a decision without changing its verdict", async ({
  page,
  request,
}) => {
  const response = await request.post("/api/scans", { data: { mode: "demo" } });
  const report = await response.json();
  report.mode = "live";
  const decisions: Record<string, unknown>[] = [];
  let signedIn = true;
  await page.route("**/api/session", async (route) => {
    if (route.request().method() === "DELETE") {
      signedIn = false;
      await route.fulfill({ json: { signedOut: true } });
    } else
      await route.fulfill({
        status: signedIn ? 200 : 401,
        json: signedIn ? { actor: { id: "peter" } } : { error: "Sign in" },
      });
  });
  await page.route("**/api/scans", async (route) => {
    if (route.request().method() === "GET")
      await route.fulfill({
        json: {
          scans: [
            {
              id: report.id,
              created_at: report.createdAt,
              status: report.status,
            },
          ],
        },
      });
    else await route.continue();
  });
  await page.route(`**/api/scans/${report.id}`, (route) =>
    route.fulfill({ json: { report, decisions } }),
  );
  await page.route(`**/api/scans/${report.id}/decisions`, async (route) => {
    const data = route.request().postDataJSON();
    const item = {
      id: "synthetic-decision",
      finding_id: data.findingId,
      action: data.action,
      reason: data.reason,
      created_at: new Date().toISOString(),
    };
    decisions.push(item);
    await route.fulfill({ status: 201, json: item });
  });
  await page.goto("/");
  await expect(page.getByText("Signed in as")).toBeVisible();
  await page.getByLabel("Saved scans").selectOption(report.id);
  await expect(
    page.getByRole("heading", { name: "Manifest assessment" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Potential credential in supplied content/ })
    .click();
  await page
    .getByLabel("Reason or review note")
    .fill("Reviewed synthetic fixture; remediation still needed.");
  await page.getByRole("button", { name: "Acknowledge", exact: true }).click();
  await expect(
    page.getByRole("list", { name: "Decision history" }),
  ).toContainText("acknowledge");
  expect(decisions).toHaveLength(1);
  await page.screenshot({
    path: "test-results/member-decision.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Back to report" }).click();
  await expect(
    page.getByRole("heading", { name: "2 blockers need attention" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Sign in with GitHub" }),
  ).toBeVisible();
});

test("expired decision session clears stale member state and offers sign-in", async ({
  page,
  request,
}) => {
  const response = await request.post("/api/scans", { data: { mode: "demo" } });
  const report = await response.json();
  report.mode = "live";
  await page.route("**/api/session", (route) =>
    route.fulfill({ json: { actor: { id: "louise" } } }),
  );
  await page.route("**/api/scans", (route) =>
    route.fulfill({
      json: {
        scans: [{
          id: report.id,
          created_at: report.createdAt,
          status: report.status,
        }],
      },
    }),
  );
  await page.route(`**/api/scans/${report.id}`, (route) =>
    route.fulfill({ json: { report, decisions: [] } }),
  );
  await page.route(`**/api/scans/${report.id}/decisions`, (route) =>
    route.fulfill({ status: 401, json: { error: "Session expired." } }),
  );
  await page.goto("/");
  await expect(page.getByText("Signed in as")).toBeVisible();
  await page.getByLabel("Saved scans").selectOption(report.id);
  await page
    .getByRole("button", { name: /Potential credential in supplied content/ })
    .click();
  await page.getByRole("button", { name: "Acknowledge", exact: true }).click();
  await expect(page.getByRole("link", { name: "Sign in with GitHub" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in again" })).toBeVisible();
  await expect(page.getByText("Signed in as")).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Decision history" })).toHaveCount(0);
});
