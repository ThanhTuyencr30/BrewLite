export interface Category {
  id: number;
  name: string;
  slug: string;
  productCount: number;
}

export interface ProductSize {
  size: "S" | "M" | "L";
  additionalPrice: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  price: number;
  imageUrl: string;
  stock: number;
  isOutOfStock: boolean;
  category: Pick<Category, "id" | "name" | "slug">;
  sizes: ProductSize[];
}

export interface Promotion {
  id: number;
  code: string;
  description: string | null;
  discountType: "PERCENT" | "FIXED_AMOUNT";
  value: number;
  minOrderValue: number;
  maxDiscount: number | null;
  startsAt: string;
  endsAt: string;
  isAvailable: boolean;
  availabilityMessage: string | null;
}

export interface PromotionValidation {
  valid: true;
  promotion: Promotion;
  discount: number;
  subtotal: number;
  total: number;
}

export interface CartValidationInputItem {
  productId: number;
  size: ProductSize["size"];
  quantity: number;
  expectedUnitPrice: number;
}

export interface CartValidationResult {
  valid: boolean;
  subtotal: number;
  items: {
    productId: number;
    size: ProductSize["size"];
    quantity: number;
    currentUnitPrice: number;
    availableStock: number;
    priceChanged: boolean;
  }[];
  issues: {
    productId: number;
    reason: "UNAVAILABLE" | "OUT_OF_STOCK" | "PRICE_CHANGED";
    message: string;
    productName: string;
    requestedQuantity: number;
    availableStock: number;
  }[];
}
