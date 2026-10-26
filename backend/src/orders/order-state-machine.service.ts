import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus } from '../generated/prisma/client';

@Injectable()
export class OrderStateMachine {
  // Định nghĩa các luồng chuyển trạng thái hợp lệ
  private readonly validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED, OrderStatus.PAYMENT_FAILED],
    [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
    [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    [OrderStatus.COMPLETED]: [], // Trạng thái kết thúc
    [OrderStatus.CANCELLED]: [], // Trạng thái kết thúc
    [OrderStatus.PAYMENT_FAILED]: [OrderStatus.PENDING, OrderStatus.CANCELLED],
  };

  assertTransition(currentStatus: OrderStatus, nextStatus: OrderStatus): void {
    const allowed = this.validTransitions[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Lỗi: Không thể chuyển trạng thái từ ${currentStatus} sang ${nextStatus}`
      );
    }
  }
}