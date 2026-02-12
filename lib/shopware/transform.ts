import type { Schemas } from "#shopware";
import type { ListItem } from "components/layout/search/filter";
import { isSeoUrls } from "lib/shopware/helpers";

import type {
  Cart,
  CartItem,
  Collection,
  Menu,
  Page,
  Product,
  ProductOption,
  ProductVariant,
} from "./types";

export function transformMenu(res: Schemas["Category"][], type: string) {
  const menu: Menu[] = [];

  res.map((item) => menu.push(transformMenuItem(item, type)));

  return menu;
}

function transformMenuItem(item: Schemas["Category"], type: string): Menu {
  const path = isSeoUrls()
    ? item.seoUrls && item.seoUrls.length > 0 && item.seoUrls[0] && item.seoUrls[0].seoPathInfo
      ? type === "footer-navigation"
        ? `/cms/${item.seoUrls[0].seoPathInfo}`
        : `/search/${item.seoUrls[0].seoPathInfo}`
      : ""
    : type === "footer-navigation"
      ? `/cms/${item.id}`
      : `/search/${item.id}`;

  // @ToDo: currently only footer-navigation is used for cms pages, this need to be more dynamic (shoud depending on the item)
  return {
    id: item.id ?? "",
    title: item.name,
    children: item.children?.map((item) => transformMenuItem(item, type)) ?? [],
    path: path,
    type: item.children && item.children.length > 0 ? "headline" : "link",
  };
}

export function transformPage(
  category: Schemas["Category"],
  seoUrlElement?: Schemas["SeoUrl"],
): Page {
  const cmsPage: Schemas["CmsPage"] | undefined = category.cmsPage ?? undefined;
  const plainHtmlContent = cmsPage ? transformToPlainHtmlContent(cmsPage) : "";

  return {
    id: seoUrlElement?.id ?? category.id ?? "",
    title: category.translated?.metaTitle ?? category.name ?? "",
    handle: seoUrlElement?.seoPathInfo ?? category.id ?? "",
    body: plainHtmlContent ?? category.description ?? "",
    bodySummary: category.translated?.metaDescription ?? category.description ?? "",
    seo: {
      title: category.translated?.metaTitle ?? category.name ?? "",
      description: category.translated?.metaDescription ?? category.description ?? "",
    },
    createdAt: seoUrlElement?.createdAt ?? category.createdAt ?? "",
    updatedAt: seoUrlElement?.updatedAt ?? category.updatedAt ?? "",
    routeName: seoUrlElement?.routeName,
    originalCmsPage: category.cmsPage,
    foreignKey: seoUrlElement?.foreignKey ?? category.id,
  };
}

export function transformToPlainHtmlContent(cmsPage: Schemas["CmsPage"]): string {
  let plainHtmlContent = "";

  cmsPage.sections?.map((section) => {
    section.blocks?.map((block) => {
      block.slots?.map((slot) => {
        if (slot.slot === "content" && (slot.fieldConfig as { content: string })?.content) {
          const currentContent = `${(slot?.fieldConfig as { content: string })?.content}`;
          // we do not add content with h1, because will be added via template already
          if (!currentContent.match(/(<\/?h)([1])/)) {
            plainHtmlContent += currentContent;
          }
        }
      });
    });
  });

  return plainHtmlContent;
}

export function transformCollection(
  resCategory: Schemas["Category"],
  seoUrlElement?: Schemas["SeoUrl"],
) {
  return {
    handle: seoUrlElement?.seoPathInfo ?? resCategory.id ?? "",
    title: resCategory.translated?.metaTitle ?? resCategory.name ?? "",
    description: resCategory.description ?? "",
    featuredImage: resCategory?.media?.url ?? "",
    seo: {
      title: resCategory.translated?.metaTitle ?? resCategory.name ?? "",
      description: resCategory.translated?.metaDescription ?? resCategory.description ?? "",
    },
    updatedAt:
      seoUrlElement?.updatedAt ??
      seoUrlElement?.createdAt ??
      resCategory.updatedAt ??
      resCategory.createdAt,
  };
}

export function transformSubCollection(
  category?: (Schemas["EntitySearchResult"] & { elements?: Schemas["Category"][] }) | undefined,
  parentCollectionName?: string,
): Collection[] {
  const collection: Collection[] = [];

  if (category?.elements?.[0]?.children) {
    // we do not support type links at the moment and show only visible categories
    category.elements[0].children
      .filter((item) => item.visible)
      .filter((item) => item.type !== "link")
      .map((item) => {
        const handle =
          isSeoUrls() && item.seoUrls ? findHandle(item.seoUrls, parentCollectionName) : item.id;
        if (handle) {
          collection.push({
            handle: handle,
            title: item.translated?.metaTitle ?? item.name ?? "",
            description: item.description ?? "",
            seo: {
              title: item.translated?.metaTitle ?? item.name ?? "",
              description: item.translated?.metaDescription ?? item.description ?? "",
            },
            childCount: item.childCount ?? 0,
            updatedAt: item.updatedAt ?? item.createdAt ?? "",
          });
        }
      });
  }

  return collection;
}

// small function to find longest handle and to make sure parent collection name is in the path
function findHandle(seoUrls: Schemas["SeoUrl"][], parentCollectionName?: string): string {
  let handle = "";
  seoUrls.map((item) => {
    if (
      !item.isDeleted &&
      item.isCanonical &&
      item.seoPathInfo &&
      item.seoPathInfo.length > handle.length &&
      item.seoPathInfo.includes(parentCollectionName ?? "")
    ) {
      handle = item.seoPathInfo;
    }
  });

  return handle;
}

export function transformCollectionToList(collection: Collection[]): ListItem[] {
  const listItem: ListItem[] = [];

  if (collection && collection.length > 0) {
    collection.map((item) => {
      // we asume that when there is not product child count it must be a cms page
      const pagePrefix = item.childCount === 0 ? "/cms" : "/search";
      const newHandle = item.handle.replace("Welcome-to-Shopware-Frontends/", "");
      listItem.push({
        title: item.title,
        path: `${pagePrefix}/${newHandle}`,
      });
    });
  }

  return listItem;
}

export function transformProducts(res: Schemas["ProductListingResult"]): Product[] {
  const products: Product[] = [];

  if (res.elements && res.elements.length > 0) {
    res.elements.map((item) => products.push(transformProduct(item)));
  }

  return products;
}

export function transformProduct(item: Schemas["Product"]): Product {
  const productOptions = transformOptions(item);
  const productVariants = transformVariants(item);

  let path = item.parentId ?? item.id ?? "";
  if (isSeoUrls()) {
    path =
      item.seoUrls && item.seoUrls.length > 0 && item.seoUrls[0] && item.seoUrls[0].seoPathInfo
        ? item.seoUrls[0].seoPathInfo
        : "";
  }

  return {
    id: item.id ?? "",
    path: path,
    handle: item.id ?? "",
    availableForSale: item.available ?? false,
    title: item.translated ? (item.translated.name ?? "") : item.name,
    description: item.translated?.metaDescription
      ? (item.translated.metaDescription ?? "")
      : (item.metaDescription ?? ""),
    descriptionHtml: item.translated?.description
      ? (item.translated.description ?? "")
      : (item.description ?? ""),
    options: productOptions,
    priceRange: {
      maxVariantPrice: {
        amount: item.calculatedPrice?.totalPrice ? String(item.calculatedPrice?.totalPrice) : "0",
        currencyCode: "EUR",
      },
      minVariantPrice: {
        amount: item.calculatedCheapestPrice?.totalPrice
          ? String(item.calculatedPrice?.totalPrice)
          : "0",
        currencyCode: "EUR",
      },
    },
    variants: productVariants,
    merchandise: {
      selectedOptions: [],
    },
    featuredImage: {
      url: item.cover?.media?.url ?? "",
      altText: item.cover?.media?.translated?.alt ?? "",
      width: item.cover?.media?.metaData?.width ? Number(item.cover?.media?.metaData?.width) : 0,
      height: item.cover?.media?.metaData?.width ? Number(item.cover?.media?.metaData?.height) : 0,
    },
    images: item.media
      ? item.media.map((img) => ({
          url: img.media?.url ?? "",
          altText: img.media?.translated?.alt ?? "",
          width: img.media?.metaData?.width ? Number(img.media?.metaData?.width) : 0,
          height: img.media?.metaData?.width ? Number(img.media?.metaData?.height) : 0,
        }))
      : [],
    seo: {
      title: item.translated?.metaTitle ?? item.translated?.name ?? item.name ?? "",
      description: item.translated?.metaDescription ?? "",
    },
    tags: [""], // @ToDo: Add keywords or do we have tags?
    updatedAt: item.updatedAt ?? "",
  };
}

function transformOptions(parent: Schemas["Product"]): ProductOption[] {
  // we only transform options for parents with children, ignore child products with options
  const productOptions: ProductOption[] = [];
  if (parent.children && parent.parentId === null && parent.children.length > 0) {
    const group: { [key: string]: string[] } = {};
    const groupId: { [key: string]: string } = {};
    parent.children.map((child) => {
      child.options?.map((option) => {
        if (option?.group) {
          groupId[option.group.name] = option.groupId;
          group[option.group.name] = group[option.group.name]
            ? [...new Set([...(group[option.group.name] as []), ...[option.name]])]
            : [option.name];
        }
      });
    });

    for (const [key, value] of Object.entries(group)) {
      for (const [currentGroupName, currentGroupId] of Object.entries(groupId)) {
        if (key === currentGroupName) {
          productOptions.push({
            id: currentGroupId,
            name: key,
            values: value,
          });
        }
      }
    }
  }

  return productOptions;
}

function transformVariants(parent: Schemas["Product"]): ProductVariant[] {
  const productVariants: ProductVariant[] = [];
  if (parent.children && parent.parentId === null && parent.children.length > 0) {
    parent.children.map((child) => {
      if (child.id) {
        const selectedOptions: { name: string; value: string }[] = [];
        child.options?.map((option) => {
          if (option.group) {
            selectedOptions.push({
              name: option.group.name,
              value: option.name,
            });
          }
        });
        const currentVariant: ProductVariant = {
          id: child.id,
          title: child.name,
          availableForSale: child.available ?? false,
          selectedOptions: selectedOptions,
          price: {
            amount: child.calculatedPrice?.totalPrice
              ? String(child.calculatedPrice?.totalPrice)
              : "0",
            currencyCode: "EUR",
          },
        };

        productVariants.push(currentVariant);
      }
    });
  }

  return productVariants;
}

export function transformHandle(handle: string | []): string {
  let collectionName: string | [] | undefined = handle;
  if (Array.isArray(collectionName)) {
    collectionName = collectionName.join("/");
  }

  return collectionName ?? "";
}

export function transformCart(resCart?: Schemas["Cart"]): Promise<Cart> {
  return new Promise((resolve) => {
    const cart: Cart = {
      checkoutUrl: "https://frontends-demo.vercel.app",
      cost: {
        subtotalAmount: {
          amount: resCart?.price?.positionPrice?.toString() || "0",
          currencyCode: "EUR",
        },
        totalAmount: {
          amount: resCart?.price?.totalPrice?.toString() || "0",
          currencyCode: "EUR",
        },
        totalTaxAmount: {
          amount: "0",
          currencyCode: "EUR",
        },
      },
      id: resCart?.token ?? "",
      lines:
        resCart?.lineItems?.map((lineItem: Schemas["LineItem"]) => transformLineItem(lineItem)) ||
        [],
      totalQuantity: resCart?.lineItems ? calculateTotalCartQuantity(resCart.lineItems) : 0,
    };
    resolve(cart);
  });
}

function calculateTotalCartQuantity(lineItems: Schemas["LineItem"][]) {
  let totalQuantity = 0;
  for (const lineItem of lineItems) {
    totalQuantity += lineItem.quantity ?? 0;
  }

  return totalQuantity;
}

function transformLineItem(resLineItem: Schemas["LineItem"]): CartItem {
  return {
    id: resLineItem.id || "",
    quantity: resLineItem.quantity ?? 0,
    cost: {
      totalAmount: {
        amount: resLineItem.price?.totalPrice.toString() || "",
        currencyCode: "EUR",
      },
    },
    merchandise: {
      id: resLineItem.referencedId ?? "",
      title: resLineItem.label ?? "",
      selectedOptions:
        resLineItem.payload?.options?.map((option) => ({
          name: option?.group.toString() ?? "",
          value: option.option,
        })) || [],
      product: {
        handle: resLineItem.referencedId ?? "",
        description: resLineItem.description ?? "",
        descriptionHtml: resLineItem.description ?? "",
        id: resLineItem.referencedId ?? "",
        images: [],
        path: resLineItem.referencedId ?? "",
        seo: {
          description: resLineItem.description ?? "",
          title: resLineItem.label ?? "",
        },
        availableForSale: true,
        featuredImage: {
          url: resLineItem.cover?.url ?? "",
          altText: resLineItem.cover?.media?.translated?.alt ?? resLineItem.cover?.media?.alt ?? "",
          width: Number(resLineItem.cover?.metaData?.width) ?? 0,
          height: Number(resLineItem.cover?.metaData?.height) ?? 0,
        },
        options: [],
        variants: [],
        merchandise: {
          selectedOptions: [],
        },
        priceRange: {
          minVariantPrice: {
            amount: "", // @ToDo: should be correct value
            currencyCode: "EUR",
          },
          maxVariantPrice: {
            amount: "", // @ToDo: should be correct value
            currencyCode: "EUR",
          },
        },
        tags: [],
        title: resLineItem.label ?? "",
        updatedAt: resLineItem.payload?.updatedAt ?? resLineItem.payload?.createdAt ?? "",
      },
    },
  };
}
