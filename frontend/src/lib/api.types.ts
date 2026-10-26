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
export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  loyaltyPoints: number;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
