import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatus } from '../generated/prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('orders')
@UseGuards(AuthGuard('jwt')) 
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('me')
  getMyOrders(@Req() req: any, @Query('status') status?: OrderStatus) {
    return this.ordersService.getMyOrders(req.user.id, status);
  }

  @Get(':id')
  getOrderDetail(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.getOrderDetail(id, req.user.id);
  }

  @Post(':id/cancel')
  cancelOrder(
    @Param('id') id: string, 
    @Req() req: any, 
    @Body('reason') reason: string
  ) {
    return this.ordersService.cancelOrder(id, req.user.id, reason);
  }
}