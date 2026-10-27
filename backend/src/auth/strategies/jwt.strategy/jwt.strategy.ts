import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: unknown): { id: string } {
    if (typeof payload !== 'object' || payload === null) {
      throw new UnauthorizedException();
    }

    const id = Reflect.get(payload, 'sub');
    if (typeof id !== 'string' || id.length === 0) {
      throw new UnauthorizedException();
    }

    return { id };
  }
}
