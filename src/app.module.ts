import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ShopModule } from './api/shop/shop.module';
import { AuthModule } from './api/auth/auth.module';
import { OptimizationModule } from './api/optimization/optimization.module';
@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
   MongooseModule.forRoot(process.env.MONGODB_URI as string),

   ShopModule,
   AuthModule,
   OptimizationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
