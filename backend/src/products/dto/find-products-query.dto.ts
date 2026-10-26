import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class FindProductsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'category must be a lowercase slug',
  })
  category?: string;
}
