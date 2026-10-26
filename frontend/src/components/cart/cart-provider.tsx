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

export interface CartItem {
  id: string;
  productId: number;
  name: string;
  imageUrl: string;
  size: "S" | "M" | "L";
  quantity: number;
  unitPrice: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  storageError: string;
  appliedPromotion: PromotionValidation | null;
  addItem: (item: Omit<CartItem, "id" | "quantity">) => void;
  setQuantity: (id: string, quantity: number) => void;
  updateItem: (id: string, quantity: number, unitPrice: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setAppliedPromotion: (promotion: PromotionValidation | null) => void;
}

const CART_STORAGE_KEY = "brewlite-cart";
const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<CartItem>;
  return (
    typeof item.id === "string" &&
    typeof item.productId === "number" &&
    typeof item.name === "string" &&
    typeof item.imageUrl === "string" &&
    (item.size === "S" || item.size === "M" || item.size === "L") &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    typeof item.unitPrice === "number" &&
    Number.isInteger(item.unitPrice) &&
    item.unitPrice >= 0
  );
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
          if (!Array.isArray(parsed) || !parsed.every(isCartItem)) {
            throw new Error("Dữ liệu giỏ hàng đã lưu không hợp lệ.");
          }
          setItems(parsed);
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
    (item: Omit<CartItem, "id" | "quantity">) => {
      const id = `${item.productId}-${item.size}`;
      setItems((currentItems) => {
        const existingItem = currentItems.find((current) => current.id === id);
        if (existingItem) {
          return currentItems.map((current) =>
            current.id === id
              ? { ...current, quantity: current.quantity + 1 }
              : current,
          );
        }
        return [...currentItems, { ...item, id, quantity: 1 }];
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
