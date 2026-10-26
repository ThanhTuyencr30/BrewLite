import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule'; 
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoriesModule } from './categories/categories.module';
import { PrismaModule } from './database/prisma.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module'; 
import { PaymentsModule } from './payments/payments.module';
import { PromotionsModule } from './promotions/promotions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), 
    PrismaModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    PaymentsModule,
    PromotionsModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}