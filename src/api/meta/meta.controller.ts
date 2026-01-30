import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OptimizeMetaTitleDto } from '../../dto/meta-title/optimize-meta-title.dto';
import { SaveMetaTitleDto } from '../../dto/meta-title/save-meta-title.dto';
import { MetaService } from './meta.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SaveMetaDescriptionDto } from 'src/dto/meta-description/save-meta-description.dto';
import { OptimizeMetaDescriptionDto } from 'src/dto/meta-description/optimize-meta-description.dto';

@Controller('api/meta')
@UseGuards(JwtAuthGuard)
export class MetaController {
  constructor(private readonly MetaService: MetaService) {}

  /**
   * 🔹 AI Meta Title Optimization
   */
  @Post('title/optimize')
  async titleOptimize(@Req() req,@Body() dto: OptimizeMetaTitleDto) {
    const { shopId } = req.user;
    // const metaTitle =
     return await this.MetaService.generateAIMetaTitle(
        shopId,
        dto,
      );
  }

    @Post('description/optimize')
    async descriptionOptimize(@Req() req,@Body() dto: OptimizeMetaDescriptionDto) {
    const { shopId } = req.user;
     return await this.MetaService.generateAIMetaDescription(
        shopId,
        dto,
      );
  }

  /**
   * 🔹 Save Meta Title (Old → New)
   */
  @Post('title/save')
  async saveTitle(@Req() req, @Body() dto: SaveMetaTitleDto) {
    const { shopId } = req.user;
    return this.MetaService.applyMetaTitleOptimization(
      shopId,
      dto,
    );
  }

    @Post('description/save')
  async saveDescription(@Req() req, @Body() dto: SaveMetaDescriptionDto) {
    const { shopId } = req.user;
    return this.MetaService.applyMetaDescriptionOptimization(
      shopId,
      dto,
    );
  }
}
