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
  await expect(
    page.getByRole("link", { name: "Read source advisory" }),
  ).toHaveAttribute(
    "href",
    "https://osv.dev/vulnerability/GHSA-35jh-r3h4-6jhm",
  );
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
  await expect(page.locator('.error[role="alert"]')).toContainText(
    "Sign in to run live scans.",
  );
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
