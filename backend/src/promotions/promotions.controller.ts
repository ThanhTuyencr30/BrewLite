import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { PromotionsService } from './promotions.service';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  // GET /promotions -> Lấy danh sách mã khả dụng
  @Get()
  async getPromotions() {
    return this.promotionsService.getActivePromotions();
  }

  // POST /promotions/apply -> Áp dụng mã vào đơn hàng
  @Post('apply')
  async applyPromotion(
    @Body('orderId') orderId: string,
    @Body('code') code: string,
  ) {
    return this.promotionsService.applyPromotionToOrder(orderId, code);
  }

  // DELETE /promotions/remove/:orderId -> Gỡ mã khỏi đơn hàng
  @Delete('remove/:orderId')
  async removePromotion(@Param('orderId') orderId: string) {
    return this.promotionsService.removePromotionFromOrder(orderId);
  }
}