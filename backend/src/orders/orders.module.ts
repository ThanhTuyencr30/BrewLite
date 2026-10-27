import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderStateMachine } from './order-state-machine.service';
import { OrdersScheduler } from './orders.scheduler';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderStateMachine, OrdersScheduler],
})
export class OrdersModule {}
