import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
  Req,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImageSeoService } from './image-seo.service';
import { AIBulkImageOptimizationDto } from 'src/dto/image/ai-image-optimization.dto';
import { ApplyImageOptimizationDto } from 'src/dto/image/apply-image-optimization.dto';

@UseGuards(JwtAuthGuard)
@Controller('seo/image')
export class ImageSeoController {
  constructor(private readonly imageSeoService: ImageSeoService) {}

  @Post('optimize')
 async generateBulkImageAlt(
  @Req() req,
  @Body() dto: AIBulkImageOptimizationDto,
) {
  const { shopId } = req.user;
  return this.imageSeoService.generateAIBulkImageSEO(shopId, dto);
}

  @Post('save')
  async saveImage(@Req() req,@Body() dto: any,){
  const { shopId } = req.user;
  return this.imageSeoService.applyImageOptimization(shopId, dto);
  }
}
