import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  // Không kiểm tra độ dài: mật khẩu sai luôn trả 401, chỉ đăng ký mới có quy tắc độ dài.
  @IsString()
  @IsNotEmpty()
  password: string;
}