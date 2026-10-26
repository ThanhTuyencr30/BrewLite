import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SizeCode, IceLevel } from '../../generated/prisma/enums';
class OrderItemDto {
  @IsInt()
  productId: number;

  @IsString()
  size: SizeCode;

  @IsOptional()
  iceLevel?: IceLevel;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  toppingIds?: number[];
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  discountCode?: string;
}