import { expect, test } from "@playwright/test";
import { CategoryPage } from "../page-objects/CategoryPage";
import { HomePage } from "../page-objects/HomePage";

test.describe.only("Category pagination", () => {
  let homePage: HomePage;
  let categoryPage: CategoryPage;

  // Before Hook
  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    categoryPage = new CategoryPage(page);

    await homePage.visitMainPage();
  });

  test("Category pagination verification", async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes("/search/Products?page=2") && response.status() === 200,
    );
    await homePage.openCateoryPage();
    await categoryPage.changePage();
    await responsePromise;
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/search/Products?page=2");
  });

  test("Category filters verification", async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/search/Products?sort=price-desc") && response.status() === 200,
    );
    await homePage.openCateoryPage();
    await categoryPage.checkCategoryFilter();
    await responsePromise;
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/search/Products?sort=price-desc");
  });
});
