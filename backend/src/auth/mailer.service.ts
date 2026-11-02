import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail(email: string, resetUrl: string) {
    const host = this.configService.get<string>('MAIL_HOST');
    const portValue = this.configService.get<string>('MAIL_PORT');
    const from = this.configService.get<string>('MAIL_FROM');
    const port = Number(portValue);

    if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !from) {
      throw new InternalServerErrorException(
        'Password reset email delivery is not configured.',
      );
    }

    const username = this.configService.get<string>('MAIL_USER');
    const password = this.configService.get<string>('MAIL_PASSWORD');
    if (Boolean(username) !== Boolean(password)) {
      throw new InternalServerErrorException(
        'Both MAIL_USER and MAIL_PASSWORD must be configured together.',
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure:
        this.configService.get<string>('MAIL_SECURE') === 'true' || port === 465,
      ...(username && password
        ? { auth: { user: username, pass: password } }
        : {}),
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Đặt lại mật khẩu BrewLite',
      text: [
        'Bạn vừa yêu cầu đặt lại mật khẩu BrewLite.',
        `Mở liên kết sau để tạo mật khẩu mới: ${resetUrl}`,
        'Liên kết có hiệu lực trong 60 phút và chỉ sử dụng được một lần.',
        'Nếu bạn không yêu cầu, hãy bỏ qua email này.',
      ].join('\n\n'),
      html: `<p>Bạn vừa yêu cầu đặt lại mật khẩu BrewLite.</p><p><a href="${resetUrl}">Tạo mật khẩu mới</a></p><p>Liên kết có hiệu lực trong 60 phút và chỉ sử dụng được một lần.</p><p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
    });
  }
}
