import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderStateMachine } from './order-state-machine.service';
import { OrdersScheduler } from './orders.scheduler';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../database/prisma.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [PrismaModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [OrdersController],
  providers: [OrdersService, OrderStateMachine, OrdersScheduler, JwtStrategy],
})
export class OrdersModule {}