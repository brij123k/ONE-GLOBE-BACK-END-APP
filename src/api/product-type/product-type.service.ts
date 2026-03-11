import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';

import { Shop } from 'src/schema/shop.schema';
import { ProductTypeHistory } from 'src/schema/product-type/product-type-history.schema';
import { UpdateProductTypeDto } from 'src/dto/product-type/update-product-type.dto';
import { UPDATE_PRODUCT_TYPE_MUTATION } from 'src/graphql/update-product-type.mutation';
import { AiService } from 'src/config/ai.service';
import { ShopifyService } from 'src/common/shopify/shopify.service';
import { OptimizeProductTypeDto } from 'src/dto/product-type/optimize-product-type.dto';
import { PRODUCT_TYPE_AI_QUERY } from 'src/graphql/productTypes/product-type-ai.query';
import { buildProductTypePrompt } from 'src/common/buildProductTypePrompt';
import { AIProductTypeSuggestionDto } from 'src/dto/product-type/ai-product-type-suggestion.dto';

@Injectable()
export class ProductTypeService {

  constructor(
    @InjectModel(Shop.name)
    private shopModel: Model<Shop>,

    @InjectModel(ProductTypeHistory.name)
    private productTypeHistoryModel: Model<ProductTypeHistory>,

    private readonly aiService: AiService,
    private readonly shopifyService: ShopifyService,
  ) {}



  async generateAIProductType(
    shopId: string,
    dto: OptimizeProductTypeDto,
  ) {

    const shop = await this.shopModel.findById(shopId).lean();
    if (!shop) throw new Error("Invalid shop");

    const response = await this.shopifyService.shopifyRequest(
      shop.shopDomain,
      shop.accessToken,
      PRODUCT_TYPE_AI_QUERY,
      { id: dto.productId },
    );

    const product = response.product;
    if (!product) throw new Error("Product not found");

    const oldProductType = product.productType || "";

    const prompt = buildProductTypePrompt(product);

    let aiProductType = await this.aiService.generateProductType(prompt);

    aiProductType = aiProductType.replace(/["']/g, "").trim();



    if (dto.apply === true) {

      const applied = await this.updateProductType(shopId, {
        productId: dto.productId,
        oldProductType,
        newProductType: aiProductType,
      });

      return {
        applied: true,
        productId: dto.productId,
        oldProductType,
        newProductType: aiProductType,
        result: applied,
      };
    }


    return {
      productId: dto.productId,
      oldProductType,
      newProductType: aiProductType,
    };
  }



  async getAIProductTypeSuggestions(
    shopId: string,
    dto: AIProductTypeSuggestionDto,
  ) {

    const prompt = `
You are an ecommerce SEO expert.

Optimize and normalize the following Shopify product types.

Product Types:
${dto.productTypes.join("\n")}

Rules:
- remove duplicates
- simplify naming
- keep SEO friendly
- return a clean list

Return result as comma separated list.
`;

    const aiResponse = await this.aiService.generateProductType(prompt);

    return {
      suggestions: aiResponse.split(",").map(v => v.trim())
    };
  }



  async updateProductType(
    shopId: string,
    dto: UpdateProductTypeDto,
  ) {

    const shop = await this.shopModel.findById(shopId).lean();
    if (!shop) throw new Error("Invalid shop");


    const response = await this.shopifyService.shopifyRequest(
      shop.shopDomain,
      shop.accessToken,
      UPDATE_PRODUCT_TYPE_MUTATION,
      {
        input: {
          id: dto.productId,
          productType: dto.newProductType,
        }
      }
    );


    const errors = response.productUpdate.userErrors;

    if (errors?.length) {
      throw new Error(JSON.stringify(errors));
    }


    await this.productTypeHistoryModel.create({
      shopId,
      productId: dto.productId,
      oldProductType: dto.oldProductType,
      newProductType: dto.newProductType,
    });


    return {
      message: "Product type updated successfully",
      updatedCount:1
    };

  }


}