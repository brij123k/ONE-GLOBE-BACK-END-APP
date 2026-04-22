import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DetailService } from './detail.service';
import { OptimizeDetailDto } from 'src/dto/detail/optimize-detail.dto';
import { SaveDetailDto } from 'src/dto/detail/save-detail.dto';

@Controller('api/detail')
@UseGuards(JwtAuthGuard)
export class DetailController {
  constructor(private readonly detailService: DetailService) {}

  @Get('products')
  async getProducts(@Req() req) {
    const { shopId } = req.user;
    return this.detailService.getStoredProducts(shopId);
  }

  @Post('optimize')
  async optimize(@Req() req, @Body() dto: OptimizeDetailDto) {
    const { shopId } = req.user;
    return this.detailService.optimizeDetail(shopId, dto);
  }

  @Post('save')
  async save(@Req() req, @Body() dto: SaveDetailDto) {
    const { shopId } = req.user;
    return this.detailService.saveToShopify(shopId, dto);
  }
}
