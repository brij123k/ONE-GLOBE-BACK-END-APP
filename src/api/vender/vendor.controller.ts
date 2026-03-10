import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VendorService } from './vendor.service';
import { UpdateVendorDto } from 'src/dto/vender/update-vendor.dto';

@Controller('api/vendor')
@UseGuards(JwtAuthGuard)
export class VendorController {

  constructor(
    private readonly vendorService: VendorService
  ) {}

  @Post('update')
  async updateVendor(
    @Req() req,
    @Body() dto: UpdateVendorDto
  ) {
    return this.vendorService.updateVendor(
      req.user.shopId,
      dto,
    );
  }

}