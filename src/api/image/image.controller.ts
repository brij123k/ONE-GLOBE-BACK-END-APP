import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImageService } from './image.service';
import { UpdateImageAltDto } from 'src/dto/image/update-image-alt.dto';
import { UpdateImageNameDto } from 'src/dto/image/update-image-name.dto';

@Controller('api/image')
@UseGuards(JwtAuthGuard)
export class ImageController {

  constructor(private readonly imageService: ImageService) {}

  @Post('alt/update')
  async updateImageAlt(
    @Req() req,
    @Body() dto: UpdateImageAltDto,
  ) {
    return this.imageService.updateImageAlt(
      req.user.shopId,
      dto,
    );
  }

@Post("name/update")
async updateImageName(
  @Req() req,
  @Body() dto: UpdateImageNameDto
) {
  return this.imageService.updateImageName(
    req.user.shopId,
    dto
  );
}

}