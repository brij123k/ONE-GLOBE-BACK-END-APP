import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { SpecificationService } from './specifications.service';
import { AnalyzeProductImageDto } from 'src/dto/metafirlds/product-image-analysis.dto';
import { AddProductMetafieldDto } from 'src/dto/metafirlds/add-product-metafield.dto';
import { CreateMetafieldDto } from 'src/dto/metafirlds/create-metafield.dto';
import { UpdateSpecificationDto } from 'src/dto/metafirlds/update-specification.dto';

@Controller('specification')
@UseGuards(JwtAuthGuard)
export class SpecificationController {

  constructor(
    private readonly specificationService: SpecificationService
  ) {}
@Post("analyze-image")
analyzeImage(@Req() req, @Body() dto: AnalyzeProductImageDto) {
  const { shopId } = req.user;
  return this.specificationService.analyzeProductImage(shopId, dto);
}

@Post("update-specification")
updateSpecification(@Req() req, @Body() dto: UpdateSpecificationDto) {

  const { shopId } = req.user;

  return this.specificationService.updateSpecification(shopId, dto);
}

@Post("create-metafield")
createMetafield(@Req() req, @Body() dto:CreateMetafieldDto) {
  const { shopId } = req.user;
  return this.specificationService.createMetafield(shopId, dto);
}

@Post("add-product-metafield")
addProductMetafield(@Req() req, @Body() dto:AddProductMetafieldDto) {
  const { shopId } = req.user;
  return this.specificationService.addProductMetafield(shopId, dto);
}

@Get("metafields")
getMetafields(@Req() req) {
  const { shopId } = req.user;
  return this.specificationService.getMetafields(shopId);
}
@Get("check-specification-metafield")
checkSpecificationMetafield(@Req() req) {

  const { shopId } = req.user;

  return this.specificationService.checkSpecificationMetafield(shopId);
}
@Post("check--metafield")
checkMetafield(@Req() req,@Body() dto:any) {

  const { shopId } = req.user;

  return this.specificationService.checkMetafield(shopId,dto.metaFieldName);
}
@Post("metafields/analyze")
analizeforKeyword(@Req() req,@Body() dto:any){
  const { shopId } = req.user;
  return this.specificationService.generateSeoKeywords(shopId,dto)
}

}