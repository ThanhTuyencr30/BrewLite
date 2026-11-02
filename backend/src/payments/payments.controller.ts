import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Redirect,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

type AuthenticatedRequest = Request & { user: { id: string } };

const DEFAULT_FRONTEND_URL = 'http://localhost:3000';

// VNPay yêu cầu địa chỉ IPv4/IPv6 của khách; chuẩn hóa dạng ::ffff:1.2.3.4 và ::1.
function getClientIp(request: Request): string {
  const forwarded = request.headers['x-forwarded-for'];
  const raw =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim() ||
    request.ip ||
    request.socket.remoteAddress ||
    '';
  const ip = raw.replace(/^::ffff:/, '');
  return ip === '::1' || ip === '' ? '127.0.0.1' : ip;
}

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(request.user.id, dto, getClientIp(request));
  }

  // VNPay chuyển trình duyệt của khách về đây sau khi thanh toán. Không có JWT
  // vì đây là redirect từ VNPay; tính xác thực dựa vào chữ ký.
  @Get('vnpay/return')
  @Redirect()
  async vnpayReturn(@Query() query: Record<string, string>) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || DEFAULT_FRONTEND_URL;
    const outcome = await this.paymentsService.handleVnpayCallback(query);
    const target = new URL('/payment/result', frontendUrl);

    if (outcome.paymentId) {
      target.searchParams.set('paymentId', outcome.paymentId);
    } else {
      target.searchParams.set('error', outcome.code === '97' ? 'invalid-signature' : 'not-found');
    }

    return { url: target.toString() };
  }

  // VNPay gọi server-to-server để báo kết quả; phải trả JSON đúng định dạng của VNPay.
  @Get('vnpay/ipn')
  async vnpayIpn(@Query() query: Record<string, string>) {
    const outcome = await this.paymentsService.handleVnpayCallback(query);
    return { RspCode: outcome.code, Message: outcome.message };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.paymentsService.findOne(request.user.id, id);
  }

  // Giả lập ngân hàng xác nhận đã nhận chuyển khoản QR.
  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard)
  confirmQr(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.paymentsService.confirmQr(request.user.id, id);
  }
}
