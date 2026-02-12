import { TAGS } from "lib/constants";
import { isSeoUrls } from "lib/shopware/helpers";
import { NextResponse } from "next/server";
import {
  getApiClient,
  requestCategory,
  requestCategoryList,
  requestCategoryProductsCollection,
  requestCrossSell,
  requestNavigation,
  requestProductsCollection,
  requestSearchCollectionProducts,
  requestSeoUrl,
  requestSeoUrls,
} from "./api";
import {
  getDefaultCategoryCriteria,
  getDefaultCategoryWithCmsCriteria,
  getDefaultCrossSellingCriteria,
  getDefaultProductCriteria,
  getDefaultProductsCriteria,
  getDefaultSearchProductsCriteria,
  getDefaultSubCategoriesCriteria,
  getSeoUrlCriteria,
  getSortingCriteria,
} from "./criteria";
import {
  transformCollection,
  transformHandle,
  transformMenu,
  transformPage,
  transformProduct,
  transformProducts,
  transformSubCollection,
} from "./transform";

import { Schemas } from "#shopware";
import { ApiClientError } from "@shopware/api-client";
import { cacheLife, cacheTag } from "next/cache";
import type { Menu, Page, Product } from "./types";

export async function getMenu(params?: {
  type?: Schemas["NavigationType"];
  depth?: number;
}): Promise<Menu[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.collections);

  const type = params?.type || "main-navigation";
  const depth = params?.depth || 1;
  const res = await requestNavigation(type, depth);

  return res ? transformMenu(res, type) : [];
}

export async function getPage(handle: string | []): Promise<Page | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.collections);

  let seoUrlElement;
  let pageIdOrHandle = decodeURIComponent(transformHandle(handle)).replace("cms/", "");
  if (pageIdOrHandle === "") {
    return undefined;
  }

  if (isSeoUrls()) {
    seoUrlElement = await getFirstSeoUrlElement(pageIdOrHandle);
    if (seoUrlElement) {
      pageIdOrHandle = seoUrlElement.foreignKey;
    }

    if (!seoUrlElement) {
      console.log("[getPage] Did not found any seoUrl element with page handle:", pageIdOrHandle);
    }
  }

  const category = await getCategory(pageIdOrHandle);
  if (!category) {
    console.log("[getPage] Did not found any category with handle:", pageIdOrHandle);
  }

  return category ? transformPage(category, seoUrlElement) : undefined;
}

export async function getFirstSeoUrlElement(
  handle: string,
): Promise<Schemas["SeoUrl"] | undefined> {
  const seoURLCriteria = getSeoUrlCriteria(handle);
  const seoURL = await requestSeoUrl(seoURLCriteria);
  if (seoURL && seoURL.elements && seoURL.elements.length > 0 && seoURL.elements[0]) {
    return seoURL.elements[0];
  }
}

export async function getFirstProduct(productId: string): Promise<Schemas["Product"] | undefined> {
  const productCriteria = getDefaultProductCriteria(productId);
  const listing = await requestProductsCollection(productCriteria);
  if (listing && listing?.elements && listing?.elements?.length > 0 && listing?.elements?.[0]) {
    return listing?.elements[0];
  }
}

// ToDo: should be more dynamic (depending on handle), should work with server and not client see generateStaticParams from next.js
export async function getSubCollections(collection: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.collections);

  const collectionName = decodeURIComponent(transformHandle(collection ?? ""));
  let criteria = getDefaultSubCategoriesCriteria(collectionName);

  const parentCollectionName =
    Array.isArray(collection) && collection[0] ? collection[0] : undefined;

  if (isSeoUrls()) {
    const seoUrlElement = await getFirstSeoUrlElement(collectionName);
    if (seoUrlElement) {
      criteria = getDefaultSubCategoriesCriteria(seoUrlElement.foreignKey);
    }
  }

  const res = await requestCategoryList(criteria);
  if (!res.elements) {
    res.elements = [];
  }
  if (!res) {
    return;
  }

  return res ? transformSubCollection(res, parentCollectionName) : [];
}

export async function getSearchCollectionProducts(params?: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
  categoryId?: string;
  defaultSearchCriteria?: Partial<Schemas["Criteria"]>;
}) {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.products);

  const searchQuery = params?.query ?? "";
  const criteria = getDefaultSearchProductsCriteria(searchQuery);
  const sorting = getSortingCriteria(params?.sortKey, params?.reverse);
  const searchCriteria = { ...criteria, ...sorting };

  const search = await requestSearchCollectionProducts(searchCriteria);
  if (isSeoUrls() && search) {
    search.elements = await changeVariantUrlToParentUrl(search);
  }

  // Ensure elements is always an array
  if (search && !search.elements) {
    search.elements = [];
  }

  return search ? transformProducts(search) : [];
}

export async function changeVariantUrlToParentUrl(
  collection: Schemas["ProductListingResult"],
): Promise<Schemas["Product"][]> {
  const newElements: Schemas["Product"][] = [];
  if (collection.elements && collection.elements.length > 0) {
    await Promise.all(
      collection.elements.map(async (item) => {
        if (item.parentId && item.seoUrls && item.seoUrls[0]) {
          const parentProduct = await getFirstProduct(item.parentId);
          if (parentProduct && parentProduct.seoUrls && parentProduct.seoUrls[0]) {
            item.seoUrls[0].seoPathInfo = parentProduct.seoUrls[0].seoPathInfo;
          }
        }

        newElements.push(item);
      }),
    );
  }

  return newElements;
}

export async function getCollectionProducts(params?: {
  collection: string;
  page?: number;
  reverse?: boolean;
  sortKey?: string;
  categoryId?: string;
  defaultSearchCriteria?: Schemas["Criteria"];
}): Promise<{ products: Product[]; total: number; limit: number }> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.collections, TAGS.products);

  let products;
  let category = params?.categoryId;
  const collectionName = decodeURIComponent(transformHandle(params?.collection ?? ""));
  const sorting = getSortingCriteria(params?.sortKey, params?.reverse);

  if (isSeoUrls() && !category && collectionName !== "") {
    const seoUrlElement = await getFirstSeoUrlElement(collectionName);
    if (seoUrlElement) {
      category = seoUrlElement.foreignKey;
    }
    if (!category) {
      console.log(
        "[useListing][search] Did not found any category with collection name:",
        collectionName,
      );
    }
  }

  if (!isSeoUrls()) {
    category = collectionName ?? undefined;
  }

  if (category) {
    const criteria = !params?.defaultSearchCriteria
      ? getDefaultProductsCriteria(params?.page)
      : params?.defaultSearchCriteria;
    const productsCriteria = { ...criteria, ...sorting };
    products = await requestCategoryProductsCollection(category, productsCriteria);
    if (products) {
      products.elements = await changeVariantUrlToParentUrl(products);
    }
  }

  return products
    ? {
        products: transformProducts(products),
        total: products.total ?? 0,
        limit: products.limit ?? 0,
      }
    : { products: [], total: 0, limit: 0 };
}

export async function getCategory(
  categoryId: string,
  cms: boolean = false,
): Promise<Schemas["Category"] | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.collections);

  const criteria = cms ? getDefaultCategoryWithCmsCriteria() : getDefaultCategoryCriteria();
  return await requestCategory(categoryId, criteria);
}

// This function is only used for generateMetadata at app/search/(collection)/[...collection]/page.tsx
export async function getCollection(handle: string | []) {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.collections);

  let path;
  let seoUrlElement;
  let categoryIdOrHandle = decodeURIComponent(transformHandle(handle));

  if (isSeoUrls()) {
    seoUrlElement = await getFirstSeoUrlElement(categoryIdOrHandle);
    if (seoUrlElement) {
      categoryIdOrHandle = seoUrlElement.foreignKey;
      path = seoUrlElement.seoPathInfo ?? "";
    }
  }

  const category = await getCategory(categoryIdOrHandle);
  if (category) {
    const collection = transformCollection(category, seoUrlElement);
    path = path ?? category.id ?? "";

    return {
      ...collection,
      path: `/search/${path}`,
    };
  }
}

export async function getProductSeoUrls() {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.products);

  const productSeoUrls: { path: string; updatedAt: string }[] = [];
  const seoUrls = await requestSeoUrls("frontend.detail.page");

  if (seoUrls && seoUrls.elements && seoUrls.elements.length > 0) {
    seoUrls.elements.map((item) =>
      productSeoUrls.push({ path: item.seoPathInfo, updatedAt: item.updatedAt ?? item.createdAt }),
    );
  }

  return productSeoUrls;
}

export async function getProduct(handle: string | []): Promise<Product | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.products);

  let productSW: Schemas["Product"] | undefined;
  let productId: string | undefined;
  const productHandle = decodeURIComponent(transformHandle(handle));

  if (isSeoUrls()) {
    const seoUrlElement = await getFirstSeoUrlElement(productHandle);
    if (seoUrlElement) {
      productId = seoUrlElement.foreignKey;
    } else {
      productId = productHandle; // fallback: try using the handle as a direct ID
    }
  } else {
    productId = productHandle; // without seoUrls the handle is the product id
  }

  if (!productId) {
    console.log("[getProduct][search] Did not found any product with handle:", handle);
  }

  if (productId) {
    const firstProduct = await getFirstProduct(productId);
    if (firstProduct) {
      productSW = firstProduct;
    }
  }

  return productSW ? transformProduct(productSW) : undefined;
}

export async function getProductRecommendations(productId: string): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.products);

  const products = {} as unknown as Schemas["ProductListingResult"];

  const res = await requestCrossSell(productId, getDefaultCrossSellingCriteria());
  // @ToDo: Make this more dynamic to merge multiple Cross-Sellings, at the moment we only get the first one
  if (res && res[0] && res[0].products) {
    products.elements = res[0].products;
  }

  return products ? transformProducts(products) : [];
}

// This is called from `app/api/revalidate.ts` so providers can control revalidation logic.
export async function revalidate(): Promise<NextResponse> {
  return NextResponse.json({
    status: 200,
    message: "This is currently not working and was never tested.",
    now: Date.now(),
  });
}

export async function getCart(cartId?: string): Promise<Schemas["Cart"] | undefined> {
  try {
    const apiClient = getApiClient(cartId);
    const cart = await apiClient.invoke("readCart get /checkout/cart", {});

    return cart.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error(error);
      console.error("Details:", error.details);
    } else {
      console.error("==>", error);
    }
  }
}
