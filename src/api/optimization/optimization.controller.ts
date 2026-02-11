import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptimizationService } from './optimization.service';
import { StoreOptimizationDto } from 'src/dto/store-optimization.dto';
import { ApplyTitleOptimizationDto } from 'src/dto/title/apply-title-optimization.dto';
import { ApplyDescriptionOptimizationDto } from 'src/dto/description/apply-description-optimization.dto';
import { AITitleOptimizationDto } from 'src/dto/title/ai-title-optimization.dto';
import { AIDescriptionOptimizationDto } from 'src/dto/description/ai-title-optimization.dto';

@Controller('api/optimization')
@UseGuards(JwtAuthGuard)
export class OptimizationController {
    constructor(private readonly optimizationService: OptimizationService) { }

    @Post('store')
    async storeProducts(@Req() req, @Body() dto: StoreOptimizationDto) {
        const { shopId } = req.user;
        return this.optimizationService.storeProducts(shopId, dto);
    }

    @Get('products')
    async getProducts(
        @Req() req,
        @Query('serviceName') serviceName: string,
    ) {
        const { shopId } = req.user;
        return this.optimizationService.getOptimizedProducts(shopId, serviceName);
    }

    @Post('apply/title')
    async applyTitle(
        @Req() req,
        @Body() dto: ApplyTitleOptimizationDto,
    ) {
        const { shopId } = req.user;
        return this.optimizationService.applyTitleOptimization(shopId, dto);
    }

    @Post('apply/description')
    async applyDescription(
        @Req() req,
        @Body() dto: ApplyDescriptionOptimizationDto,
    ) {
        const { shopId } = req.user;
        return this.optimizationService.applyDescriptionOptimization(shopId, dto);
    }

    @Post('ai/title')
async aiTitleOptimization(
  @Req() req,
  @Body() dto: AITitleOptimizationDto,
) {
  const { shopId } = req.user;
  return this.optimizationService.generateAITitle(shopId, dto);
}

@Post('ai/description')
async aiDescriptionOptimization(
  @Req() req,
  @Body() dto: AIDescriptionOptimizationDto,
) {
  const { shopId } = req.user;
//   console.log(shopId)
  return this.optimizationService.generateAIDescription(shopId, dto);
}

}
