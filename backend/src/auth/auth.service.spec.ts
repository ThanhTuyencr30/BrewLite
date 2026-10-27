import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    jwtService = { signAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('rejects registering an email that already exists', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.register({ email: 'hello@example.com', password: 'coffee123' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('stores a bcrypt hash instead of the plain-text password', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({
      id: 'new-user',
      email: 'hello@example.com',
      fullName: null,
      phone: null,
      loyaltyPoints: 0,
    });

    await service.register({
      email: 'hello@example.com',
      password: 'coffee123',
    });

    const [{ passwordHash }] = usersService.create.mock.calls[0];
    expect(passwordHash).not.toBe('coffee123');
    await expect(bcrypt.compare('coffee123', passwordHash)).resolves.toBe(true);
  });

  it('returns a JWT and public user details for valid credentials', async () => {
    const passwordHash = await bcrypt.hash('coffee123', 4);
    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'hello@example.com',
      passwordHash,
      fullName: 'Coffee Lover',
      phone: null,
      loyaltyPoints: 12,
    });
    jwtService.signAsync.mockResolvedValue('signed-jwt');

    await expect(
      service.login({ email: 'hello@example.com', password: 'coffee123' }),
    ).resolves.toEqual({
      accessToken: 'signed-jwt',
      user: {
        id: 'user-id',
        email: 'hello@example.com',
        fullName: 'Coffee Lover',
        phone: null,
        loyaltyPoints: 12,
      },
    });
  });

  it('rejects invalid login credentials', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'coffee123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('returns the public user profile without password fields', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-id',
      email: 'hello@example.com',
      passwordHash: 'must-not-be-returned',
      fullName: 'Coffee Lover',
      phone: null,
      loyaltyPoints: 12,
    });

    await expect(service.me('user-id')).resolves.toEqual({
      id: 'user-id',
      email: 'hello@example.com',
      fullName: 'Coffee Lover',
      phone: null,
      loyaltyPoints: 12,
    });
  });
});
