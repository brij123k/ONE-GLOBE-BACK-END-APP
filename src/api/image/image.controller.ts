import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImageService } from './image.service';
import { UpdateImageAltDto } from 'src/dto/image/update-image-alt.dto';
import { UpdateImageNameDto } from 'src/dto/image/update-image-name.dto';
import { OptimizeImageAltDto } from 'src/dto/image/AItImageOptimization.dto';
import { OptimizeImageNameDto } from 'src/dto/image/OptimizeImageName.dto';

@Controller('api/image')
@UseGuards(JwtAuthGuard)
export class ImageController {

  constructor(private readonly imageService: ImageService) { }

  @Post('ai/alt')
  generateAlt(
    @Req() req,
    @Body() dto: OptimizeImageAltDto,
  ) {
    const { shopId } = req.user;
    console.log(shopId,'1')
    return this.imageService.generateAIImageAlt(shopId, dto);
  }

  @Post('ai/name/')
  generateName(
    @Req() req,
    @Body() dto: OptimizeImageNameDto,
  ) {
    const { shopId } = req.user;
    return this.imageService.generateAIImageName(shopId, dto);
  }
  @Post('alt/update')
  async updateImageAlt(
    @Req() req,
    @Body() dto: UpdateImageAltDto,
  ) {
    const { shopId } = req.user;
    return this.imageService.updateImageAlt(
      shopId,
      dto,
    );
  }

  @Post("name/update")
  async updateImageName(
    @Req() req,
    @Body() dto: UpdateImageNameDto
  ) {
    const { shopId } = req.user;
    return this.imageService.updateImageName(
      shopId,
      dto
    );
  }

}