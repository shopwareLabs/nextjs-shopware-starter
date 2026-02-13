"use server";

import type { Schemas } from "#shopware";
import { ApiClientError } from "@shopware/api-client";
import { TAGS } from "lib/constants";
import { getApiClient } from "lib/shopware/api";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function fetchCart(cartId?: string): Promise<Schemas["Cart"] | undefined> {
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

export async function addItem(prevState: unknown, selectedVariantId: string | undefined) {
  const cart = await getCart();
  if (!cart) {
    return "Could not get cart";
  }
  const cartId = await updateCartCookie(cart);

  if (!selectedVariantId) {
    return "Missing product variant ID";
  }

  try {
    let quantity = 1;
    const apiClient = getApiClient(cartId);

    // this part allows us to click multiple times on addToCart and increase the qty with that
    const itemInCart = cart?.lineItems?.find((item) => item.id === selectedVariantId);
    if (itemInCart?.quantity) {
      quantity = itemInCart.quantity + 1;
    }

    const response = await apiClient.invoke("addLineItem post /checkout/cart/line-item", {
      body: {
        items: [
          {
            id: selectedVariantId,
            quantity: quantity,
            referencedId: selectedVariantId,
            type: "product",
          },
        ],
      },
    });

    const errorMessage = alertErrorMessages(response.data);
    if (errorMessage !== "") {
      updateTag(TAGS.cart);
      return errorMessage;
    }
    updateTag(TAGS.cart);
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error(error);
      console.error("Details:", error.details);
    } else {
      console.error("==>", error);
    }
  }
}

export async function getCart(currentCartId?: string): Promise<Schemas["Cart"] | undefined> {
  const cartId = currentCartId || (await cookies()).get("sw-context-token")?.value;

  const cart = await fetchCart(cartId);
  return cart;
}

async function updateCartCookie(cart: Schemas["Cart"]): Promise<string | undefined> {
  const cartId = (await cookies()).get("sw-context-token")?.value;

  // cartId is set, but not valid anymore, update the cookie
  if (cart.token && cart.token !== cartId) {
    (await cookies()).set("sw-context-token", cart.token);
    return cart.token;
  }
  return cartId;
}

function alertErrorMessages(response: Schemas["Cart"]): string {
  let errorMessages = "";
  if (response.errors) {
    for (const value of Object.values(response.errors as Schemas["CartError"])) {
      const messageKey: string | undefined = value.messageKey;
      if (value.message && messageKey) {
        errorMessages += value.message;
      }
    }
  }

  return errorMessages;
}

export async function updateItemQuantity(
  prevState: unknown,
  payload: {
    lineId: string | undefined;
    variantId: string | undefined;
    quantity: number;
  },
) {
  const cartId = (await cookies()).get("sw-context-token")?.value;

  if (!cartId) {
    return "Missing cart ID";
  }

  const { lineId, variantId, quantity } = payload;

  try {
    if (quantity === 0) {
      await removeItem(null, lineId);
      updateTag(TAGS.cart);
      return;
    }

    await updateLineItem(lineId, variantId, quantity);
    updateTag(TAGS.cart);
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error(error);
      console.error("Details:", error.details);
    } else {
      return "Error updating item quantity";
    }
  }
}

export async function removeItem(prevState: unknown, lineId?: string) {
  const cartId = (await cookies()).get("sw-context-token")?.value;

  if (!cartId) {
    return "Cart ID is missing";
  }

  if (!lineId) {
    return "Line ID is missing";
  }

  try {
    const apiClient = getApiClient(cartId);
    await apiClient.invoke("removeLineItem post /checkout/cart/line-item/delete", {
      body: {
        ids: [lineId],
      },
    });
    updateTag(TAGS.cart);
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error(error);
      console.error("Details:", error.details);
    } else {
      console.error("==>", error);
    }
  }
}

async function updateLineItem(
  lineId: string | undefined,
  variantId: string | undefined,
  quantity: number,
) {
  const cartId = (await cookies()).get("sw-context-token")?.value;

  if (!cartId) {
    return { message: "Missing cart ID" } as Error;
  }

  if (!lineId || !variantId) {
    return { message: "Missing line ID or variant ID" } as Error;
  }

  try {
    const apiClient = getApiClient(cartId);
    await apiClient.invoke("updateLineItem patch /checkout/cart/line-item", {
      body: {
        items: [
          {
            id: lineId,
            referencedId: variantId,
            quantity: quantity,
          } as unknown as Schemas["LineItem"],
        ],
      },
    });
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error(error);
      console.error("Details:", error.details);
    } else {
      console.error("==>", error);
    }
  }
}

export async function redirectToCheckout() {
  const cartId = (await cookies()).get("cartId")?.value;

  if (!cartId) {
    return "Missing cart ID";
  }

  const cart = await getCart(cartId);

  if (!cart) {
    return "Error fetching cart";
  }
  // @ts-expect-error checkoutUrl may not exist
  redirect(cart.checkoutUrl);
}

export async function createCartAndSetCookie() {
  const cart = await getCart();
  if (cart?.token) {
    (await cookies()).set("sw-context-token", cart?.token);
  }
}
