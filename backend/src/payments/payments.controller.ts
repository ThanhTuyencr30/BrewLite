import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

interface AuthenticatedRequest {
  user: { id: string };
}

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(request.user.id, dto);
  }

  // Giả lập ngân hàng xác nhận đã nhận chuyển khoản QR.
  @Post(':id/confirm')
  confirmQr(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.confirmQr(request.user.id, id);
  }
}
