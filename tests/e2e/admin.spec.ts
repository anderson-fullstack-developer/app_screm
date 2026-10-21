import { test, expect } from "./fixtures";
import { register, login, uniqueEmail, ADMIN } from "./helpers";

test("non-admin cannot reach /admin", async ({ page }) => {
  await register(page, uniqueEmail());
  const res = await page.goto("/admin");
  expect(res?.status()).toBe(404);
});

test("regular user has no Admin link and no create-room button", async ({
  page,
}) => {
  await register(page, uniqueEmail());
  await expect(
    page.getByRole("link", { name: "Admin", exact: true }),
  ).toHaveCount(0);
  // broadcasting is disabled by default → CTA is "Ver salas ao vivo"
  await expect(
    page.getByRole("link", { name: "Ver salas ao vivo" }),
  ).toBeVisible();
});

test("non-admin cannot reach /admin/users", async ({ page }) => {
  await register(page, uniqueEmail());
  const res = await page.goto("/admin/users");
  expect(res?.status()).toBe(404);
});

test("admin sees the user list and can search it", async ({ page }) => {
  const email = uniqueEmail("users");
  await register(page, email);
  await page.context().clearCookies();

  await login(page, ADMIN.email, ADMIN.password);
  await page.goto("/admin");
  await page.getByRole("link", { name: /Utilizadores/ }).click();
  await page.waitForURL("**/admin/users");
  await expect(
    page.getByRole("heading", { name: "Utilizadores", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Total de utilizadores")).toBeVisible();

  await page.getByLabel("Pesquisar utilizadores").fill(email);
  await page.getByRole("button", { name: "Pesquisar" }).click();
  await expect(page.getByText("1 resultado para")).toBeVisible();
  const row = page.getByRole("row", { name: new RegExp(email.replace(/[+.]/g, "\\$&")) });
  await expect(row).toBeVisible();
  await expect(row).toContainText("E2E User");
  await expect(row).toContainText("Email");
});

test("admin sees the panel and the broadcast toggle", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(
    page.getByRole("link", { name: "Admin", exact: true }),
  ).toBeVisible();

  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Painel de administração" }),
  ).toBeVisible();
  await expect(page.getByText("Permissões dos utilizadores")).toBeVisible();
  await expect(
    page.getByRole("switch", {
      name: /Permitir que utilizadores criem salas/,
    }),
  ).toBeVisible();
});
