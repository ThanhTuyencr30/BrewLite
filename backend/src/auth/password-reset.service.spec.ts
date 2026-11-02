import { createHash } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { MailerService } from './mailer.service';
import { PasswordResetService } from './password-reset.service';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let prisma: {
    passwordResetToken: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let transaction: {
    passwordResetToken: {
      create: jest.Mock;
      deleteMany: jest.Mock;
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
    user: { update: jest.Mock };
  };
  let usersService: { findByEmail: jest.Mock };
  let mailerService: { sendPasswordResetEmail: jest.Mock };

  beforeEach(async () => {
    transaction = {
      passwordResetToken: {
        create: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: { update: jest.fn().mockResolvedValue({}) },
    };
    prisma = {
      passwordResetToken: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn((callback) => callback(transaction)),
    };
    usersService = { findByEmail: jest.fn() };
    mailerService = { sendPasswordResetEmail: jest.fn().mockResolvedValue({}) };

    const module = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: usersService },
        { provide: MailerService, useValue: mailerService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:3000/') },
        },
      ],
    }).compile();
    service = module.get(PasswordResetService);
  });

  it('returns the same response without creating a token for an unknown email', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(service.requestReset('missing@example.com')).resolves.toEqual({
      message:
        'Nếu email đã đăng ký, hướng dẫn đặt lại mật khẩu sẽ được gửi trong ít phút.',
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(mailerService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('emails a single-use token while storing only its hash', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
    });

    await service.requestReset('user@example.com');

    const [{ create }] = prisma.passwordResetToken.upsert.mock.calls[0];
    const [, resetUrl] = mailerService.sendPasswordResetEmail.mock.calls[0];
    const token = new URL(resetUrl).searchParams.get('token');

    expect(token).toMatch(/^[a-f0-9]{64}$/);
    if (!token) {
      throw new Error('Reset link did not include a token.');
    }
    expect(create.tokenHash).toBe(
      createHash('sha256').update(token).digest('hex'),
    );
    expect(resetUrl).toContain(
      'http://localhost:3000/reset-password?token=',
    );
  });

  it('limits repeat reset emails to one request per minute', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
    });
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      createdAt: new Date(),
    });

    await service.requestReset('user@example.com');

    expect(mailerService.sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(prisma.passwordResetToken.upsert).not.toHaveBeenCalled();
  });

  it('updates the password and consumes all outstanding reset tokens', async () => {
    const token = 'a'.repeat(64);
    transaction.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-id',
      userId: 'user-id',
      expiresAt: new Date(Date.now() + 60_000),
    });

    await service.resetPassword(token, 'newPassword123');

    const [{ data }] = transaction.user.update.mock.calls[0];
    expect(
      await bcrypt.compare('newPassword123', data.passwordHash),
    ).toBe(true);
    expect(transaction.passwordResetToken.updateMany).toHaveBeenCalled();
    expect(transaction.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
    });
  });

  it('rejects expired or unknown reset tokens', async () => {
    transaction.passwordResetToken.findUnique.mockResolvedValue(null);

    await expect(
      service.resetPassword('b'.repeat(64), 'newPassword123'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(transaction.user.update).not.toHaveBeenCalled();
  });
});
