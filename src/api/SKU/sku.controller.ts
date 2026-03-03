import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SkuService } from './sku.service';
import { GetSkuDto } from 'src/dto/sku/get-sku.dto';
import { UpdateSkuDto } from 'src/dto/sku/update-sku.dto';

@Controller('api/sku')
@UseGuards(JwtAuthGuard)
export class SkuController {
  constructor(private readonly skuService: SkuService) {}

  @Post('products')
  async getProducts(@Req() req, @Body() dto: GetSkuDto) {
    return this.skuService.getProductsWithSku(
      req.user.shopId,
      dto,
    );
  }

  @Post('update')
  async updateSku(@Req() req, @Body() dto: UpdateSkuDto) {
    return this.skuService.updateSku(
      req.user.shopId,
      dto,
    );
  }
}