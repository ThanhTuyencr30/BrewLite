import { randomBytes, createHash } from 'node:crypto';
import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { MailerService } from './mailer.service';

const RESET_TOKEN_LIFETIME_MS = 60 * 60 * 1000;
const GENERIC_RESET_MESSAGE =
  'Nếu email đã đăng ký, hướng dẫn đặt lại mật khẩu sẽ được gửi trong ít phút.';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async requestReset(email: string) {
    const user = await this.usersService.findByEmail(email.trim());
    if (!user) {
      return { message: GENERIC_RESET_MESSAGE };
    }

    const previousToken = await this.prisma.passwordResetToken.findUnique({
      where: { userId: user.id },
    });
    if (
      previousToken &&
      previousToken.createdAt > new Date(Date.now() - 60 * 1000)
    ) {
      return { message: GENERIC_RESET_MESSAGE };
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_LIFETIME_MS);

    await this.prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      create: { userId: user.id, tokenHash, expiresAt },
      update: { tokenHash, expiresAt, createdAt: new Date() },
    });

    const frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000'
    ).replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await this.mailerService.sendPasswordResetEmail(user.email, resetUrl);
    } catch (error: unknown) {
      this.logger.error(
        'Unable to send a password reset email.',
        error instanceof Error ? error.stack : String(error),
      );
      try {
        await this.prisma.passwordResetToken.deleteMany({
          where: { tokenHash },
        });
      } catch (cleanupError: unknown) {
        this.logger.error(
          'Unable to remove the unsent password reset token.',
          cleanupError instanceof Error
            ? cleanupError.stack
            : String(cleanupError),
        );
      }
    }

    return { message: GENERIC_RESET_MESSAGE };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const now = new Date();

    await this.prisma.$transaction(async (transaction) => {
      const resetToken = await transaction.passwordResetToken.findUnique({
        where: { tokenHash },
      });
      if (!resetToken || resetToken.expiresAt <= now) {
        throw new UnauthorizedException(
          'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
        );
      }

      const claimedToken = await transaction.passwordResetToken.updateMany({
        where: { id: resetToken.id, expiresAt: { gt: now } },
        data: { expiresAt: now },
      });
      if (claimedToken.count !== 1) {
        throw new UnauthorizedException(
          'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
        );
      }

      await transaction.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: await bcrypt.hash(password, 10) },
      });
      await transaction.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId },
      });
    });

    return { message: 'Mật khẩu đã được đặt lại thành công.' };
  }
}
