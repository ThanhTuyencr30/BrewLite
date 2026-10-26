import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    // Lấy userId từ JWT Guard (tạm thời gán hardcode hoặc lấy từ req.user nếu đã qua AuthGuard)
    const userId = req.user?.id || '11111111-1111-1111-1111-111111111111'; 
    return await this.ordersService.createOrder(userId, createOrderDto);
  }

  // 👇 THÊM ROUTE NÀY ĐỂ FRONTEND LẤY THÔNG TIN ĐƠN HÀNG
  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return await this.ordersService.findOne(id);
  }
}