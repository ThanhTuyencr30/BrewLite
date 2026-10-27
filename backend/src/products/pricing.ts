export interface ProductPriceInput {
  sizePrice: number;
  toppingPrices: number[];
  quantity: number;
}

export interface ProductPrice {
  unitPrice: number;
  totalPrice: number;
}

export function calculateProductPrice({
  sizePrice,
  toppingPrices,
  quantity,
}: ProductPriceInput): ProductPrice {
  if (!Number.isSafeInteger(sizePrice) || sizePrice < 0) {
    throw new RangeError('Giá size phải là số nguyên không âm.');
  }
  if (
    toppingPrices.some(
      (price) => !Number.isSafeInteger(price) || price < 0,
    )
  ) {
    throw new RangeError('Giá topping phải là số nguyên không âm.');
  }
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new RangeError('Số lượng phải là số nguyên lớn hơn 0.');
  }

  const unitPrice = sizePrice + toppingPrices.reduce((total, price) => total + price, 0);
  const totalPrice = unitPrice * quantity;
  if (!Number.isSafeInteger(totalPrice)) {
    throw new RangeError('Tổng tiền vượt quá giới hạn tính toán.');
  }

  return { unitPrice, totalPrice };
}
