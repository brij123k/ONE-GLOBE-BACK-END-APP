import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductTypeService } from './product-type.service';
import { UpdateProductTypeDto } from 'src/dto/product-type/update-product-type.dto';

@Controller('api/product-type')
@UseGuards(JwtAuthGuard)
export class ProductTypeController {

  constructor(
    private readonly productTypeService: ProductTypeService
  ) {}

  @Post('update')
  async updateProductType(
    @Req() req,
    @Body() dto: UpdateProductTypeDto,
  ) {
    return this.productTypeService.updateProductType(
      req.user.shopId,
      dto,
    );
  }

}