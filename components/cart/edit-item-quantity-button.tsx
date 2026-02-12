import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { updateItemQuantity } from "components/cart/actions";
import LoadingDots from "components/loading-dots";
import type { CartItem } from "lib/shopware/types";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { UpdateType } from "./cart-context";

function SubmitButton({ type }: { type: "plus" | "minus" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-label={type === "plus" ? "Increase item quantity" : "Reduce item quantity"}
      className={clsx(
        "ease flex h-full min-w-[36px] max-w-[36px] flex-none items-center justify-center rounded-full px-2 transition-all duration-200 hover:border-neutral-800 hover:opacity-80",
        {
          "cursor-not-allowed": pending,
          "ml-auto": type === "minus",
        },
      )}
    >
      {pending ? (
        <LoadingDots className="bg-black dark:bg-white" />
      ) : type === "plus" ? (
        <PlusIcon className="h-4 w-4 dark:text-neutral-500" />
      ) : (
        <MinusIcon className="h-4 w-4 dark:text-neutral-500" />
      )}
    </button>
  );
}

type EditItemQuantityButtonProps = {
  item: CartItem;
  type: "plus" | "minus";
  optimisticUpdate: (merchandiseId: string, updateType: UpdateType) => void;
};

export function EditItemQuantityButton({ item, type }: EditItemQuantityButtonProps) {
  const [message, formAction] = useActionState(updateItemQuantity, null);
  const payload = {
    lineId: item.id,
    variantId: item.id,
    quantity: type === "plus" ? item.quantity + 1 : item.quantity - 1,
  };
  const updateItemQuantityAction = formAction.bind(null, payload);

  return (
    <form
      action={async () => {
        updateItemQuantityAction();
      }}
    >
      <SubmitButton type={type} />
      <output aria-live="polite" className="sr-only">
        {message || ""}
      </output>
    </form>
  );
}
