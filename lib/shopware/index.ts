import {
  ApiSchemas,
  Menu,
  Page,
  Product,
  ProductListingCriteria,
  StoreNavigationTypeSW
} from './types';
import {
  getDefaultCategoryCriteria,
  getDefaultCategoryWithCmsCriteria,
  getDefaultCrossSellingCriteria,
  getDefaultProductCriteria,
  getDefaultProductsCriteria,
  getDefaultSearchProductsCriteria,
  getSortingCriteria,
  getStaticCollectionCriteria
} from './criteria';
import {
  requestCategory,
  requestCategoryList,
  requestCategoryProductsCollection,
  requestCrossSell,
  requestNavigation,
  requestProductsCollection,
  requestSearchCollectionProducts,
  requestSeoUrl
} from './api';
import {
  transformCollection,
  transformHandle,
  transformMenu,
  transformPage,
  transformProduct,
  transformProducts,
  transformStaticCollection
} from './transform';

export async function getMenu(params?: {
  type?: StoreNavigationTypeSW;
  depth?: number;
}): Promise<Menu[]> {
  const type = params?.type || 'main-navigation';
  const depth = params?.depth || 1;
  const res = await requestNavigation(type, depth);

  return res ? transformMenu(res, type) : [];
}

export async function getPage(handle: string | []): Promise<Page | undefined> {
  const pageHandle = transformHandle(handle).replace('cms/', '');
  const seoUrlElement = await getFirstSeoUrlElement(pageHandle);
  if (seoUrlElement) {
    const resCategory = await getCategory(seoUrlElement);

    return resCategory ? transformPage(seoUrlElement, resCategory) : undefined;
  }
}

export async function getFirstSeoUrlElement(
  handle: string
): Promise<ApiSchemas['SeoUrl'] | undefined> {
  const resSeoUrl = await requestSeoUrl(handle);
  if (resSeoUrl.elements && resSeoUrl.elements.length > 0 && resSeoUrl.elements[0]) {
    return resSeoUrl.elements[0];
  }
}

export async function getFirstProduct(
  productId: string
): Promise<ApiSchemas['Product'] | undefined> {
  const productCriteria = getDefaultProductCriteria(productId);
  const res: ApiSchemas['ProductListingResult'] = await requestProductsCollection(productCriteria);
  if (res.elements && res.elements.length > 0 && res.elements[0]) {
    return res.elements[0];
  }
}

// ToDo: should be more dynamic (depending on handle), should work with server and not client see generateStaticParams from next.js
export async function getStaticCollections() {
  // @ToDo: This is an example about multi-filter with new store API client
  // @ts-ignore
  const resCategory = await requestCategoryList(getStaticCollectionCriteria());

  return resCategory ? transformStaticCollection(resCategory) : [];
}

export async function getSearchCollectionProducts(params?: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
  categoryId?: string;
  defaultSearchCriteria?: Partial<ProductListingCriteria>;
}) {
  const searchQuery = params?.query ?? '';
  const criteria = getDefaultSearchProductsCriteria(searchQuery);
  const sorting = getSortingCriteria(params?.sortKey, params?.reverse);
  const searchCriteria = { ...criteria, ...sorting };

  const res = await requestSearchCollectionProducts(searchCriteria);

  return res ? transformProducts(res) : [];
}

export async function getCollectionProducts(params?: {
  collection: string;
  page?: number;
  reverse?: boolean;
  sortKey?: string;
  categoryId?: string;
  defaultSearchCriteria?: Partial<ProductListingCriteria>;
}): Promise<Product[]> {
  let res;
  let category = params?.categoryId;
  const collectionName = transformHandle(params?.collection ?? '');
  const sorting = getSortingCriteria(params?.sortKey, params?.reverse);

  if (!category && collectionName !== '') {
    const seoUrlElement = await getFirstSeoUrlElement(collectionName);
    if (seoUrlElement) {
      category = seoUrlElement.foreignKey;
    }
    if (!category) {
      console.log(
        '[useListing][search] Did not found any category with collection name:',
        collectionName
      );
    }
  }

  if (category) {
    const criteria = !params?.defaultSearchCriteria
      ? getDefaultProductsCriteria(params?.page)
      : params?.defaultSearchCriteria;
    const productsCriteria = { ...criteria, ...sorting };
    res = await requestCategoryProductsCollection(category, productsCriteria);
  }

  return res ? transformProducts(res) : [];
}

export async function getCategory(
  seoUrl: ApiSchemas['SeoUrl'],
  cms: boolean = false
): Promise<ApiSchemas['Category']> {
  const criteria = cms ? getDefaultCategoryWithCmsCriteria() : getDefaultCategoryCriteria();
  const resCategory = await requestCategory(seoUrl.foreignKey, criteria);

  return resCategory;
}

// This function is only used for generateMetadata at app/search/(collection)/[...collection]/page.tsx
export async function getCollection(handle: string | []) {
  const collectionName = transformHandle(handle);
  const seoUrlElement = await getFirstSeoUrlElement(collectionName);
  if (seoUrlElement) {
    const resCategory = await getCategory(seoUrlElement);
    const path = seoUrlElement.seoPathInfo ?? '';
    const collection = transformCollection(seoUrlElement, resCategory);

    return {
      ...collection,
      path: `/search/${path}`
    };
  }
}

export async function getProduct(handle: string | []): Promise<Product | undefined> {
  let productSW: ApiSchemas['Product'] | undefined;
  let productId: string | undefined;
  const productHandle = transformHandle(handle);

  const seoUrlElement = await getFirstSeoUrlElement(productHandle);
  if (seoUrlElement) {
    productId = seoUrlElement.foreignKey;
  }

  if (!productId) {
    console.log('[getProduct][search] Did not found any product with handle:', productHandle);
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
  let products: ApiSchemas['ProductListingResult'] = {};

  const res = await requestCrossSell(productId, getDefaultCrossSellingCriteria());
  // @ToDo: Make this more dynamic to merge multiple Cross-Sellings, at the moment we only get the first one
  if (res && res[0] && res[0].products) {
    products.elements = res[0].products;
  }

  return products ? transformProducts(products) : [];
}