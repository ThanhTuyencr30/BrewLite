import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const strategy = new JwtStrategy(
    new ConfigService({ JWT_SECRET: 'test-secret' }),
  );

  it('maps the JWT subject to the authenticated user id', () => {
    expect(strategy.validate({ sub: 'user-id' })).toEqual({ id: 'user-id' });
  });

  it('rejects tokens without a subject', () => {
    expect(() => strategy.validate({})).toThrow(UnauthorizedException);
  });
});
