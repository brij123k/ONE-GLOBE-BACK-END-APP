import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { CalculatePricingDto } from 'src/dto/pricing/calculate-pricing.dto';
import { ApplyPricingDto } from 'src/dto/pricing/apply-pricing.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('pricing')
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  // 🔥 calculate only
  @Post('calculate')
  calculate(
    @Req() req,
    @Body() dto: CalculatePricingDto,
  ) {
    const { shopId } = req.user;
    return this.pricingService.calculatePricing(shopId, dto);
  }

@Post('apply')
applyPricing(
  @Req() req,
  @Body() dto: ApplyPricingDto,
) {
    const { shopId } = req.user;
  return this.pricingService.applyPricingAndStore(shopId, dto);
}
}
