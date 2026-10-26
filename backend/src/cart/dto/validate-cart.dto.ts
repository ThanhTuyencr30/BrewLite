import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  Max,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';

export class ValidateCartItemDto {
  @IsInt()
  @IsPositive()
  productId!: number;

  @IsIn(['S', 'M', 'L'])
  size!: 'S' | 'M' | 'L';

  @IsInt()
  @IsPositive()
  @Max(99)
  quantity!: number;

  @IsInt()
  @Min(0)
  expectedUnitPrice!: number;
}

export class ValidateCartDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ValidateCartItemDto)
  items!: ValidateCartItemDto[];
}
