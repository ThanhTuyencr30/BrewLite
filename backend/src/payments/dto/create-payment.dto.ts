import {
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  idempotencyKey: string;

  @IsIn(['WALLET', 'CARD', 'QR', 'VNPAY'])
  method: 'WALLET' | 'CARD' | 'QR' | 'VNPAY';

  // Chỉ dùng để giả lập cổng thanh toán thẻ; không được lưu vào database.
  @ValidateIf((dto: CreatePaymentDto) => dto.method === 'CARD')
  @Matches(/^\d{16}$/, { message: 'Số thẻ phải gồm đúng 16 chữ số.' })
  cardNumber?: string;
}
