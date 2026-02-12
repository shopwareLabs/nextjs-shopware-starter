import type { components as coreComponents } from "./storeApiTypes";

export type components = coreComponents & {
  schemas: Schemas;
};

export type Schemas = {};

export type operations = {
  "readProductCrossSellings post /product/{productId}/cross-selling": {
    contentType?: "application/json";
    accept?: "application/json";
    headers?: {
      /** Instructs Shopware to return the response in the given language. */
      "sw-language-id"?: string;
      /** Instructs Shopware to try and resolve SEO URLs for the given navigation item */
      "sw-include-seo-urls"?: boolean;
    };
    pathParams: {
      /** Product ID */
      productId: string;
    };
    body: components["schemas"]["Criteria"];
    response: components["schemas"]["CrossSellingElementCollection"];
    responseCode: 200;
  };
};
