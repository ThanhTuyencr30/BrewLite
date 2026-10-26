import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { PaymentMethod } from '../../generated/prisma/enums';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsInt()
  @Min(1)
  amount: number;
}