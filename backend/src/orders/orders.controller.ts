import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import { OrderStatus } from '../generated/prisma/client';
import { AuthGuard } from '@nestjs/passport';

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Req() request: AuthenticatedRequest, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(request.user.id, dto);
  }

  @Get('me')
  getMyOrders(
    @Req() request: AuthenticatedRequest,
    @Query('status', new ParseEnumPipe(OrderStatus, { optional: true }))
    status?: OrderStatus,
  ) {
    return this.ordersService.getMyOrders(request.user.id, status);
  }

  @Get(':id')
  getOrderDetail(@Param('id', ParseUUIDPipe) id: string, @Req() request: AuthenticatedRequest) {
    return this.ordersService.getOrderDetail(id, request.user.id);
  }

  @Post(':id/cancel')
  cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.cancelOrder(id, request.user.id, reason);
  }
}