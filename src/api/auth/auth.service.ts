import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { Shop, ShopDocument } from '../../schema/shop.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Shop.name)
    private shopModel: Model<ShopDocument>,
    private jwtService: JwtService,
  ) {}

  async login(shopDomain: string) {
    const shop = await this.shopModel.findOne({
      shopDomain,
      isActive: true,
    });

    if (!shop) {
      throw new UnauthorizedException('Shop not found or inactive');
    }

    const payload = {
      shopId: shop._id,
      shopDomain: shop.shopDomain,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      shop: {
        owner:shop.owner,
        shopDomain: shop.shopDomain,
        shopName: shop.shopName,
        email: shop.email,
        plan: shop.plan,
        country: shop.country,
        currency: shop.currency,
      },
    };
  }
}
