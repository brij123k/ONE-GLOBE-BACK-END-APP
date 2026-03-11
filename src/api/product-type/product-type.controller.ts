import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductTypeService } from './product-type.service';
import { UpdateProductTypeDto } from 'src/dto/product-type/update-product-type.dto';
import { OptimizeProductTypeDto } from 'src/dto/product-type/optimize-product-type.dto';
import { AIProductTypeSuggestionDto } from 'src/dto/product-type/ai-product-type-suggestion.dto';

@Controller("product-type")
@UseGuards(JwtAuthGuard)
export class ProductTypeController {

  constructor(
    private readonly productTypeService: ProductTypeService,
  ) {}



  @Post("ai/suggestion")
  getSuggestions(
    @Body() dto: AIProductTypeSuggestionDto,
    @Req() req,
  ) {
    return this.productTypeService.getAIProductTypeSuggestions(
      req.shopId,
      dto
    );
  }



  @Post("ai/generate")
  generateAI(
    @Body() dto: OptimizeProductTypeDto,
    @Req() req,
  ) {
    const { shopId } = req.user;
    return this.productTypeService.generateAIProductType(
      shopId,
      dto
    );
  }



  @Post("update")
  update(
    @Body() dto: UpdateProductTypeDto,
    @Req() req,
  ) {
    const { shopId } = req.user;
    return this.productTypeService.updateProductType(
      shopId,
      dto
    );
  }

}