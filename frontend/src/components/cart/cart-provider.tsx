"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PromotionValidation } from "@/lib/api.types";

export interface CartTopping {
  id: number;
  name: string;
  price: number;
}

export type CartIceLevel = "NORMAL" | "LESS" | "NONE";

export interface CartItem {
  id: string;
  productId: number;
  name: string;
  imageUrl: string;
  size: "S" | "M" | "L";
  iceLevel: CartIceLevel;
  toppings: CartTopping[];
  quantity: number;
  unitPrice: number;
}

type AddCartItemInput = Omit<CartItem, "id" | "quantity" | "iceLevel" | "toppings"> & {
  quantity?: number;
  iceLevel?: CartIceLevel;
  toppings?: CartTopping[];
};

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  storageError: string;
  appliedPromotion: PromotionValidation | null;
  addItem: (item: AddCartItemInput) => void;
  setQuantity: (id: string, quantity: number) => void;
  updateItem: (id: string, quantity: number, unitPrice: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setAppliedPromotion: (promotion: PromotionValidation | null) => void;
}

const CART_STORAGE_KEY = "brewlite-cart";
const CartContext = createContext<CartContextValue | null>(null);

function getCartItemId(
  productId: number,
  size: CartItem["size"],
  iceLevel: CartIceLevel,
  toppings: CartTopping[],
) {
  const toppingKey = toppings
    .map(({ id }) => id)
    .sort((a, b) => a - b)
    .join(".");
  return `${productId}-${size}-${iceLevel}-${toppingKey}`;
}

function parseCartItem(value: unknown): CartItem | null {
  if (typeof value !== "object" || value === null) return null;

  const item = value as Record<string, unknown>;
  const toppings = item.toppings === undefined ? [] : item.toppings;
  const iceLevel = item.iceLevel ?? "NORMAL";
  const validToppings =
    Array.isArray(toppings) &&
    toppings.every(
      (topping: unknown) =>
        typeof topping === "object" &&
        topping !== null &&
        "id" in topping &&
        typeof topping.id === "number" &&
        Number.isSafeInteger(topping.id) &&
        "name" in topping &&
        typeof topping.name === "string" &&
        "price" in topping &&
        typeof topping.price === "number" &&
        Number.isSafeInteger(topping.price) &&
        topping.price >= 0,
    );

  if (
    typeof item.id !== "string" ||
    typeof item.productId !== "number" ||
    !Number.isSafeInteger(item.productId) ||
    typeof item.name !== "string" ||
    typeof item.imageUrl !== "string" ||
    (item.size !== "S" && item.size !== "M" && item.size !== "L") ||
    (iceLevel !== "NORMAL" && iceLevel !== "LESS" && iceLevel !== "NONE") ||
    !validToppings ||
    typeof item.quantity !== "number" ||
    !Number.isSafeInteger(item.quantity) ||
    item.quantity < 1 ||
    typeof item.unitPrice !== "number" ||
    !Number.isSafeInteger(item.unitPrice) ||
    item.unitPrice < 0
  ) {
    return null;
  }

  return {
    id: getCartItemId(item.productId, item.size, iceLevel, toppings),
    productId: item.productId,
    name: item.name,
    imageUrl: item.imageUrl,
    size: item.size,
    iceLevel,
    toppings,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [appliedPromotion, setAppliedPromotion] =
    useState<PromotionValidation | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadStoredCart() {
      await Promise.resolve();
      if (!isCurrent) {
        return;
      }
      try {
        const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
          const parsed: unknown = JSON.parse(storedCart);
          if (!Array.isArray(parsed)) {
            throw new Error("Dữ liệu giỏ hàng đã lưu không hợp lệ.");
          }
          const restoredItems = parsed.map(parseCartItem);
          const validItems = restoredItems.filter(
            (item): item is CartItem => item !== null,
          );
          if (validItems.length !== restoredItems.length) {
            throw new Error("Dữ liệu giỏ hàng đã lưu không hợp lệ.");
          }
          setItems(validItems);
        }
      } catch (error: unknown) {
        setStorageError(
          error instanceof Error
            ? error.message
            : "Không thể đọc giỏ hàng đã lưu trên thiết bị này.",
        );
      } finally {
        setIsReady(true);
      }
    }

    void loadStoredCart();
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể lưu giỏ hàng trên thiết bị này.";
      queueMicrotask(() => setStorageError(message));
    }
  }, [isReady, items]);

  const addItem = useCallback(
    (item: AddCartItemInput) => {
      const toppings = item.toppings ?? [];
      const iceLevel = item.iceLevel ?? "NORMAL";
      const quantity = item.quantity ?? 1;
      if (!Number.isSafeInteger(quantity) || quantity < 1) return;

      const id = getCartItemId(item.productId, item.size, iceLevel, toppings);
      setItems((currentItems) => {
        const existingItem = currentItems.find((current) => current.id === id);
        if (existingItem) {
          return currentItems.map((current) =>
            current.id === id
              ? { ...current, quantity: current.quantity + quantity }
              : current,
          );
        }
        return [
          ...currentItems,
          { ...item, id, iceLevel, toppings, quantity },
        ];
      });
    },
    [],
  );

  const setQuantity = useCallback((id: string, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1) {
      return;
    }
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, quantity } : item,
      ),
    );
  }, []);

  const updateItem = useCallback(
    (id: string, quantity: number, unitPrice: number) => {
      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        !Number.isInteger(unitPrice) ||
        unitPrice < 0
      ) {
        return;
      }
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === id ? { ...item, quantity, unitPrice } : item,
        ),
      );
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const value = useMemo(
    () => ({
      items,
      itemCount,
      storageError,
      appliedPromotion,
      addItem,
      setQuantity,
      updateItem,
      removeItem,
      clearCart,
      setAppliedPromotion,
    }),
    [
      items,
      itemCount,
      storageError,
      appliedPromotion,
      addItem,
      setQuantity,
      updateItem,
      removeItem,
      clearCart,
      setAppliedPromotion,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart phải được dùng bên trong CartProvider.");
  }
  return context;
}
