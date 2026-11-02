import { IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/i)
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}
