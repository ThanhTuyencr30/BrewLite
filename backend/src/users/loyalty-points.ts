// 1 điểm thưởng cho mỗi 10.000đ của đơn đã thanh toán.
const VND_PER_POINT = 10_000;

export function loyaltyPointsFor(orderTotal: number): number {
  return Math.floor(orderTotal / VND_PER_POINT);
}
