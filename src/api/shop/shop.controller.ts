import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
  Req,
  UseGuards,
} from '@nestjs/common';
import type  { Response } from 'express';
import * as crypto from 'crypto';
import { ShopService } from './shop.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  /**
   * STEP 1: Start App Installation
   */
  @Get('install')
  async install(@Query('shop') shop: string, @Res() res: Response) {
    if (!shop) {
      throw new BadRequestException('Missing shop parameter');
    }

    const state = crypto.randomBytes(16).toString('hex');

    const installUrl =
      `https://${shop}/admin/oauth/authorize` +
      `?client_id=${process.env.SHOPIFY_API_KEY}` +
      `&scope=${process.env.SHOPIFY_SCOPES}` +
      `&redirect_uri=${process.env.APP_URL}/api/shop/callback` +
      `&state=${state}`;

    return res.redirect(installUrl);
  }

  /**
   * STEP 2: Shopify Callback
   */
  @Get('callback')
  async callback(
    @Query('shop') shop: string,
    @Query('code') code: string,
    @Res() res: Response,
  ) {
    if (!shop || !code) {
      throw new BadRequestException('Missing shop or code');
    }

    // 1️⃣ Exchange code for access token
    const accessToken = await this.shopService.exchangeCodeForToken(
      shop,
      code,
    );

    // 2️⃣ Get shop details
    const shopData = await this.shopService.getShopDetails(
      shop,
      accessToken,
    );

    // 3️⃣ Store in DB (USING YOUR DTO STRUCTURE)
    await this.shopService.createOrUpdateShop({
      shopDomain: shop,
      accessToken,
      shopName: shopData.name,
      email: shopData.email,
      owner: shopData.shop_owner,
      plan: shopData.plan_name,
      country: shopData.country,
      currency: shopData.currency,
    });

    // 4️⃣ Redirect user to frontend dashboard
    return res.redirect(
      `${process.env.FRONTEND_URL}?shop=${shop}`,
    );
  }

   @UseGuards(JwtAuthGuard)
  @Get('products')
  async getProducts(@Req() req, @Query() query) {
    const { shopId } = req.user;
    // console.log(query)
    return this.shopService.getProducts(shopId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('vendors')
  async getVendors(@Req() req) {

    const { shopId } = req.user;
    return this.shopService.getVendors(shopId);
  }

  @UseGuards(JwtAuthGuard)
@Get('product-types')
async getProductTypes(@Req() req) {
  const { shopId } = req.user;
  return this.shopService.getProductTypes(shopId);
}

@UseGuards(JwtAuthGuard)
@Get('tags')
async getProductTags(@Req() req) {
  const { shopId } = req.user;
  return this.shopService.getProductTags(shopId);
}

@UseGuards(JwtAuthGuard)
@Get('categories')
async getCategories(@Req() req) {
  const { shopId } = req.user;
  return this.shopService.getCategories(shopId);
}

  @UseGuards(JwtAuthGuard)
  @Get('collections')
  async getCollections(@Req() req) {
    const { shopId } = req.user;
    return this.shopService.getCollections(shopId);
  }


}
