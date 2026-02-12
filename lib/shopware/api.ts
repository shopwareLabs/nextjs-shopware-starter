import { operations, Schemas } from "#shopware";
import { ApiClientError, createAPIClient } from "@shopware/api-client";
import { getAccessToken, getApiType, getStoreDomainWithApiType } from "lib/shopware/helpers";
import { RouteNames } from "./types";

export function getApiClient(cartId?: string) {
  const apiClientParams = {
    baseURL: getStoreDomainWithApiType(),
    accessToken: getAccessToken(),
    apiType: getApiType(),
    contextToken: cartId,
  };

  return createAPIClient<operations>(apiClientParams);
}

/**
 * Retry wrapper with exponential backoff for rate-limited (429) requests.
 * Retries up to `maxRetries` times with increasing delays (500ms, 1s, 2s, ...).
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 429 && attempt < maxRetries) {
        const retryAfter = error.headers?.get?.("retry-after");
        const delay = retryAfter ? Number(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
        console.warn(
          `[Shopware API] Rate limited (429). Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("withRetry: max retries reached");
}

export async function requestNavigation(
  type: Schemas["NavigationType"],
  depth: number,
): Promise<Schemas["Category"][] | undefined> {
  try {
    const response = await withRetry(() =>
      getApiClient().invoke("readNavigation post /navigation/{activeId}/{rootId}", {
        pathParams: {
          activeId: type,
          rootId: type,
        },
        headers: {
          "sw-include-seo-urls": true,
        },
        body: {
          depth: depth,
        },
      }),
    );

    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error(error);
      console.error("Details:", error.details);
    } else {
      console.error("==>", error);
    }
  }
}

export async function requestCategory(
  categoryId: string,
  criteria?: Schemas["Criteria"],
): Promise<Schemas["Category"] | undefined> {
  try {
    const response = await withRetry(() =>
      getApiClient().invoke("readCategory post /category/{navigationId}", {
        pathParams: {
          navigationId: categoryId,
        },
        body: { ...criteria },
      }),
    );

    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error(error);
      console.error("Details:", error.details);
    } else {
      console.error("==>", error);
    }
  }
}

export async function requestCategoryList(criteria: Schemas["Criteria"]): Promise<
  {
    elements?: Schemas["Category"][];
  } & Schemas["EntitySearchResult"]
> {
  try {
    const response = await withRetry(() =>
      getApiClient().invoke("readCategoryList post /category", {
        body: { ...criteria },
      }),
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error(error);
      console.error("Details:", error.details);
    } else {
      console.error("==>", error);
    }
    return { elements: [] };
  }
}

export async function requestProductsCollection(criteria: Schemas["Criteria"]): Promise<
  | ({
      elements?: Schemas["Product"][];
    } & Schemas["EntitySearchResult"])
  | undefined
> {
  try {
    const result = await withRetry(() =>
      getApiClient().invoke("readProduct post /product", {
        body: { ...criteria },
      }),
    );
    return result.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error(error);
      console.error("Details:", error.details);
    } else {
      console.error("==>", error);
    }
  }
}

export async function requestCategoryProductsCollection(
  categoryId: string,
  criteria: Schemas["Criteria"],
): Promise<Schemas["ProductListingResult"] | undefined> {
  try {
    const response = await withRetry(() =>
      getApiClient().invoke("readProductListing post /product-listing/{categoryId}", {
        pathParams: {
          categoryId: categoryId,
        },
        body: {
          ...criteria,
        },
      }),
    );

    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error(error);
      console.error("Details:", error.details);
    } else {
      console.error("==>", error);
    }
  }
}

export async function requestSearchCollectionProducts(
  criteria?: Schemas["Criteria"],
): Promise<Schemas["ProductListingResult"] | undefined> {
  try {
    const response = await withRetry(() =>
      getApiClient().invoke("searchPage post /search", {
        body: {
          ...criteria,
          search: encodeURIComponent(criteria?.term || ""),
        },
      }),
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error(error);
      console.error("Details:", error.details);
    } else {
      console.error("==>", error);
    }
  }
}

export async function requestSeoUrls(routeName: RouteNames, page: number = 1, limit: number = 100) {
  try {
    const response = await withRetry(() =>
      getApiClient().invoke("readSeoUrl post /seo-url", {
        body: {
          page: page,
          limit: limit,
          filter: [
            {
              type: "equals",
              field: "routeName",
              value: routeName,
            },
          ],
        },
      }),
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error(error);
      console.error("Details:", error.details);
    } else {
      console.error("==>", error);
    }
  }
}

export async function requestSeoUrl(criteria: Schemas["Criteria"]): Promise<
  | ({
      elements?: Schemas["SeoUrl"][];
    } & Schemas["EntitySearchResult"])
  | undefined
> {
  try {
    const response = await withRetry(() =>
      getApiClient().invoke("readSeoUrl post /seo-url", { body: criteria }),
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error(error);
      console.error("Details:", error.details);
    } else {
      console.error("==>", error);
    }
  }
}

export async function requestCrossSell(
  productId: string,
  criteria?: Schemas["Criteria"],
): Promise<Schemas["CrossSellingElementCollection"] | undefined> {
  try {
    const response = await withRetry(() =>
      getApiClient().invoke("readProductCrossSellings post /product/{productId}/cross-selling", {
        pathParams: {
          productId: productId,
        },
        body: {
          ...criteria,
        },
      }),
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error(error);
      console.error("Details:", error.details);
    } else {
      console.error("==>", error);
    }
  }
}

export async function requestContext(cartId?: string) {
  try {
    return withRetry(() => getApiClient(cartId).invoke("readContext get /context", {}));
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error(error);
      console.error("Details:", error.details);
    } else {
      console.error("==>", error);
    }
  }
}
