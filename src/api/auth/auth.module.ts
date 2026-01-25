import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

import { Shop, ShopSchema } from 'src/schema/shop.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Shop.name, schema: ShopSchema },
    ]),

    // 🔑 REQUIRED: registers passport + default jwt strategy
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    // 🔑 REQUIRED: JWT module
    JwtModule.register({
      secret: 'Abhishek',
      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],
  controllers: [AuthController],

  // 🔑 REQUIRED: JwtStrategy must be a provider
  providers: [AuthService, JwtStrategy],

  // 🔑 Export Passport so other modules can use guards
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
