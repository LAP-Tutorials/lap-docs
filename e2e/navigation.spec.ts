import { test, expect } from "@playwright/test";

test("should navigate to home page on first render", async ({ page }) => {
  await page.goto("/");
});

test("should navigate from home page to posts page using header", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Posts" })
    .click();
  await expect(page).toHaveURL("/posts");
});

test("mobile menu opens cleanly and closes on an outside tap", async ({
  page,
}) => {
  await page.setViewportSize({ width: 810, height: 1080 });
  await page.goto("/account");

  await page.getByRole("button", { name: "Menu" }).click();

  const menu = page.getByRole("dialog", { name: "Navigation menu" });
  await expect(menu).toBeVisible();
  await expect(menu.getByPlaceholder("Search...")).not.toBeFocused();

  const menuBox = await menu.boundingBox();
  expect(menuBox).not.toBeNull();
  await page.mouse.click(8, Math.min(1070, menuBox!.y + menuBox!.height + 24));

  await expect(menu).toBeHidden();
});
