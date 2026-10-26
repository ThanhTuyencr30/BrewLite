import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatus } from '../generated/prisma/client'; 
import { AuthGuard } from '@nestjs/passport';

@Controller('orders')
@UseGuards(AuthGuard('jwt')) // Bắt buộc đăng nhập mới gọi được
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // API 1: GET /orders/me (Truyền query ?status=CANCELLED để lọc tab)
  @Get('me')
  getMyOrders(@Req() req: any, @Query('status') status?: OrderStatus) {
    // Lấy userId từ token JWT
    return this.ordersService.getMyOrders(req.user.id, status);
  }

  // API 2: GET /orders/:id (Xem chi tiết)
  @Get(':id')
  getOrderDetail(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.getOrderDetail(id, req.user.id);
  }

  // API 3: POST /orders/:id/cancel (Hủy đơn)
  @Post(':id/cancel')
  cancelOrder(
    @Param('id') id: string, 
    @Req() req: any, 
    @Body('reason') reason: string
  ) {
    return this.ordersService.cancelOrder(id, req.user.id, reason);
  }
}