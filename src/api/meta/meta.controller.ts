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

@Controller('api/meta')
export class MetaController {
  constructor(private readonly MetaService: MetaService) {}

  /**
   * 🔹 AI Meta Title Optimization
   */
  @Post('title/optimize')
  async optimize(@Req() req,@Body() dto: OptimizeMetaTitleDto) {
    const { shopId } = req.user;
    const metaTitle =
      await this.MetaService.generateAIMetaTitle(
        shopId,
        dto,
      );

    return { metaTitle };
  }

  /**
   * 🔹 Save Meta Title (Old → New)
   */
  @Post('title/save')
  async save(@Req() req, @Body() dto: SaveMetaTitleDto) {
    const { shopId } = req.user;
    return this.MetaService.applyMetaTitleOptimization(
      shopId,
      dto,
    );
  }
}
