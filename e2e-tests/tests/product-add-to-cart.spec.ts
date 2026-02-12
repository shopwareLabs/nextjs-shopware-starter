import { expect, test } from "@playwright/test";
import { HomePage } from "../page-objects/HomePage";
import { ProductPage } from "../page-objects/ProductPage";

test.describe.only("add product to cart", () => {
  let homePage: HomePage;
  let productPage: ProductPage;

  // Before Hook
  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    productPage = new ProductPage(page);

    await homePage.visitMainPage();
  });

  test("Add to cart simple product", async ({ page }) => {
    await homePage.visitMainPage();
    await homePage.openProductPage();
    await productPage.addToCart();
    await expect(page.getByText("LIGHT CLOTH TAUPE BRIGHT").first()).toBeVisible();
  });

  test("Add to cart variant product", async ({ page }) => {
    await expect(async () => {
      await homePage.openVariantsCartPage();
      await page.waitForSelector(productPage.sizeSlocator, { timeout: 10_000 });
    }).toPass({
      intervals: [2_000, 5_000],
      timeout: 30_000,
    });
    await productPage.selectVariant();
    await productPage.addToCart();
    await expect(page.getByText("LAVENDA Product Variants").first()).toBeVisible();
  });
});
