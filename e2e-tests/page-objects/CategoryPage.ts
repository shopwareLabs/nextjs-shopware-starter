import { Page } from "@playwright/test";

export class CategoryPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async changePage() {
    await this.page.waitForLoadState("load");
    await this.page.getByLabel("Next page").click();
  }

  async checkCategoryFilter() {
    await this.page.waitForLoadState("load");
    await this.page.getByRole("link", { name: "Price: High to low" }).first().click();
  }
}
