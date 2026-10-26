import { Injectable } from '@nestjs/common';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  stock: number;
  isAvailable: boolean;
}

@Injectable()
export class ProductsService {
  private products: Product[] = [
    { id: 1, name: 'Cà phê sữa', category: 'Cà phê', price: 35000, imageUrl: 'https://placehold.co/300x300?text=Ca+phe+sua', stock: 30, isAvailable: true },
    { id: 2, name: 'Americano', category: 'Cà phê', price: 40000, imageUrl: 'https://placehold.co/300x300?text=Americano', stock: 25, isAvailable: true },
    { id: 3, name: 'Cappuccino', category: 'Cà phê', price: 45000, imageUrl: 'https://placehold.co/300x300?text=Cappuccino', stock: 20, isAvailable: true },
    { id: 4, name: 'Trà đào', category: 'Trà', price: 39000, imageUrl: 'https://placehold.co/300x300?text=Tra+dao', stock: 0, isAvailable: true },
  ];

  findAll(category?: string): Product[] {
    return this.products
      .filter((p) => p.isAvailable)
      .filter((p) => !category || p.category === category);
  }
}