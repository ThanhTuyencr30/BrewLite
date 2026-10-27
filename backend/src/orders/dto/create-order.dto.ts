import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { IceLevel, SizeCode } from '../../generated/prisma/enums';

class OrderItemDto {
  @IsInt()
  productId: number;

  @IsEnum(SizeCode)
  size: SizeCode;

  @IsOptional()
  @IsEnum(IceLevel)
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
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  discountCode?: string;
}
