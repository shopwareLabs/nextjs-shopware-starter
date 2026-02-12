import { Locator, Page } from "@playwright/test";
import { AbstractPage } from "./AbstractPage";

export class HomePage extends AbstractPage {
  //readonly page: Page
  readonly sliderLocator: Locator;

  constructor(page: Page) {
    super(page);
    this.sliderLocator = page.locator("ul[class='flex animate-carousel gap-4']");
  }

  async visitMainPage() {
    await this.page.goto("/");
  }

  async openProductPage() {
    this.page.getByRole("link", { name: "LIGHT CLOTH TAUPE BRIGHT" }).click();
  }

  async openVariantsCartPage() {
    await this.page.goto("/product/LAVENDA-Product-Variants/SW20004?size=M&colour=blue");
  }

  async openCateoryPage() {
    await this.page.getByRole("link", { name: "Products" }).click();
  }

  async goToCmsPages() {
    await this.page.getByRole("link", { name: "Defective Product" }).click();
    await this.page.waitForURL("**/Defective-Product");
  }
}
