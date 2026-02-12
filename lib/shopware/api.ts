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

export async function requestNavigation(
  type: Schemas["NavigationType"],
  depth: number,
): Promise<Schemas["Category"][] | undefined> {
  try {
    const response = await getApiClient().invoke(
      "readNavigation post /navigation/{activeId}/{rootId}",
      {
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
      },
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
    const response = await getApiClient().invoke("readCategory post /category/{navigationId}", {
      pathParams: {
        navigationId: categoryId,
      },
      body: { ...criteria },
    });

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
    const response = await getApiClient().invoke("readCategoryList post /category", {
      body: { ...criteria },
    });
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
    const result = await getApiClient().invoke("readProduct post /product", {
      body: { ...criteria },
    });
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
    const response = await getApiClient().invoke(
      "readProductListing post /product-listing/{categoryId}",
      {
        pathParams: {
          categoryId: categoryId,
        },
        body: {
          ...criteria,
        },
      },
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
    const response = await getApiClient().invoke("searchPage post /search", {
      body: {
        ...criteria,
        search: encodeURIComponent(criteria?.term || ""),
      },
    });
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
    const response = await getApiClient().invoke("readSeoUrl post /seo-url", {
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
    });
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
    const response = await getApiClient().invoke("readSeoUrl post /seo-url", { body: criteria });
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
    const response = await getApiClient().invoke(
      "readProductCrossSellings post /product/{productId}/cross-selling",
      {
        pathParams: {
          productId: productId,
        },
        body: {
          ...criteria,
        },
      },
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
    return getApiClient(cartId).invoke("readContext get /context", {});
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error(error);
      console.error("Details:", error.details);
    } else {
      console.error("==>", error);
    }
  }
}
