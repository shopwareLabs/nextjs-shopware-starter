import type { Schemas } from "#shopware";

export function getDefaultProductsCriteria(page = 1, limit = 15): Schemas["Criteria"] {
  return {
    p: page,
    limit: limit,
    associations: getDefaultProductAssociations(),
    filter: [],
  };
}

export function getDefaultProductCriteria(
  productId: string,
  page = 1,
  limit = 1,
): Schemas["Criteria"] {
  return {
    page: page,
    limit: limit,
    associations: getDefaultProductAssociations(),
    filter: [
      {
        type: "equals",
        field: "id",
        value: productId,
      },
    ],
  };
}

export function getDefaultSearchProductsCriteria(
  query: string,
  page = 1,
  limit = 100,
): Schemas["Criteria"] {
  return {
    page: page,
    limit: limit,
    term: query,
    associations: {
      options: {},
      media: {},
      seoUrls: {},
      children: {
        associations: {
          options: {},
          media: {},
          seoUrls: {},
        },
      },
    },
  };
}

function getDefaultProductAssociations(): Schemas["Criteria"]["associations"] {
  return {
    options: {
      associations: {
        group: {},
      },
    },
    media: {},
    seoUrls: {},
    children: {
      associations: {
        options: {
          associations: {
            group: {},
          },
        },
        media: {},
        seoUrls: {},
      },
    },
  };
}

export function getDefaultCategoryCriteria(page = 1, limit = 1): Schemas["Criteria"] {
  return {
    page: page,
    limit: limit,
    associations: {
      media: {},
      cmsPage: {},
    },
  };
}

export function getDefaultCategoryWithCmsCriteria(page = 1, limit = 1) {
  return {
    page: page,
    limit: limit,
    associations: {
      media: {},
      cmsPage: {
        associations: {
          sections: {
            associations: {
              blocks: {
                associations: {
                  slots: {},
                },
              },
            },
          },
        },
      },
    },
  };
}

export function getStaticCollectionCriteria(page = 1, limit = 20) {
  return {
    page: page,
    limit: limit,
    associations: {
      cmsPage: {},
      seoUrls: {},
    },
    filter: [
      {
        type: "not",
        operator: "or",
        queries: [
          {
            type: "equals",
            field: "level",
            value: 1,
          },
          {
            type: "equals",
            field: "active",
            value: false,
          },
          {
            type: "equals",
            field: "cmsPage.type",
            value: "landingpage",
          },
          {
            type: "equals",
            field: "cmsPage.type",
            value: "page",
          },
          {
            type: "equals",
            field: "type",
            value: "link",
          },
          {
            type: "equals",
            field: "childCount",
            value: 0,
          },
          {
            type: "contains",
            field: "breadcrumb",
            value: "Footer",
          },
        ],
      },
    ],
  };
}

// ToDo: Can be used later for dynamic collections depending on parent collection (only show next level of categories, next to products)
export function getDefaultSubCategoriesCriteria(
  categoryId: string,
  page = 1,
  limit = 1,
): Schemas["Criteria"] {
  return {
    page: page,
    limit: limit,
    associations: {
      cmsPage: {},
      children: {
        associations: {
          seoUrls: {},
        },
        filter: [
          {
            type: "equals",
            field: "active",
            value: true,
          },
        ],
      },
    },
    filter: [
      {
        type: "equals",
        field: "id",
        value: categoryId,
      },
    ],
  };
}

export function getDefaultCrossSellingCriteria(page = 1, limit = 1): Schemas["Criteria"] {
  return {
    page: page,
    limit: limit,
    associations: {
      options: {},
      media: {},
      seoUrls: {},
    },
    filter: [
      {
        type: "equals",
        field: "active",
        value: true,
      },
    ],
  };
}

export function getSeoUrlCriteria(handle: string, page = 1, limit = 1): Schemas["Criteria"] {
  return {
    page: page,
    limit: limit,
    filter: [
      {
        type: "multi",
        operator: "or",
        queries: [
          {
            type: "equals",
            field: "seoPathInfo",
            value: `${handle}/`,
          },
          {
            type: "equals",
            field: "seoPathInfo",
            value: handle,
          },
        ],
      },
    ],
  };
}

export function getSortingCriteria(sortKey?: string, reverse?: boolean): Schemas["Criteria"] {
  switch (true) {
    case sortKey === "CREATED_AT" && reverse === true:
      return {
        sort: [
          {
            field: "createdAt",
            order: "DESC",
          },
        ],
      };
    case sortKey === "PRICE" && reverse === true:
      return {
        sort: [
          {
            field: "price",
            order: "DESC",
          },
        ],
      };
    case sortKey === "PRICE" && reverse === false:
      return {
        sort: [
          {
            field: "price",
            order: "ASC",
          },
        ],
      };
    case sortKey === "BEST_SELLING" && reverse === false:
      return {
        sort: [
          {
            field: "sales",
            order: "DESC",
          },
        ],
      };

    // sortKey === 'RELEVANCE' && reverse === false
    default:
      return {
        sort: [
          {
            field: "availableStock",
            order: "DESC",
          },
        ],
      };
  }
}
