import { IsIn, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  idempotencyKey: string;

  @IsIn(['WALLET', 'CARD', 'QR'])
  method: 'WALLET' | 'CARD' | 'QR';
}
