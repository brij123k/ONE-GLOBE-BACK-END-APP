import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalyzeProductImageDto } from 'src/dto/metafirlds/product-image-analysis.dto';

import { Shop } from 'src/schema/shop.schema';
import { AiService } from 'src/config/ai.service';
import { CREATE_METAFIELD_DEFINITION } from 'src/graphql/metafields/create-metafield-definition.query';
import { SET_PRODUCT_METAFIELD } from 'src/graphql/metafields/set-product-metafield.query';
import { GET_METAFIELD_DEFINITIONS } from 'src/graphql/metafields/get-metafield-definitions.query';
import { ShopifyService } from 'src/common/shopify/shopify.service';
import { SpecificationHistory } from 'src/schema/metafileds/specification-history.schema';
import { AddProductMetafieldDto } from 'src/dto/metafirlds/add-product-metafield.dto';
import { CreateMetafieldDto } from 'src/dto/metafirlds/create-metafield.dto';
import { UPDATE_PRODUCT_SPECIFICATION_MUTATION } from 'src/graphql/metafields/update-product-specification';
import { UpdateSpecificationDto } from 'src/dto/metafirlds/update-specification.dto';
import { CHECK_SPECIFICATION_DEFINITION_QUERY } from 'src/graphql/metafields/get-product-specification.query';

@Injectable()
export class SpecificationService {

  constructor(
    @InjectModel(Shop.name)
    private shopModel: Model<Shop>,

    @InjectModel(SpecificationHistory.name)
private historyModel: Model<SpecificationHistory>,

    private readonly aiService: AiService,
    private readonly shopifyService: ShopifyService,
  ) {}

  private async getShop(shopId: string) {
    const shop = await this.shopModel.findById(shopId).lean();
    if (!shop) throw new Error('Invalid shop');
    return shop;
  }

async analyzeProductImage(shopId: string, dto: AnalyzeProductImageDto) {

  const shop = await this.getShop(shopId);

  const prompt = `
Analyze this product image and extract ecommerce attributes.

Return ONLY valid JSON.

Fields (include if visible):

{
"color":"",
"material":"",
"size_fit":"",
"finish_pattern":"",
"dimensions":"",
"unit":"",
"weight":"",
"capacity_volume":"",
"compatible_with":""
}

Rules:
- If attribute is not visible return null
- Description should be short ecommerce style
`;

  const ai = await this.aiService.generateImageAnalysis(
    prompt,
    dto.imageUrl
  );

  console.log(ai);

  const jsonMatch = ai.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Invalid AI response");
  }

  return JSON.parse(jsonMatch[0]);
}

async updateSpecification(shopId: string, dto: UpdateSpecificationDto) {

  const shop = await this.getShop(shopId);

  const value = JSON.stringify(dto.specifications);
  console.log(value)
  const response = await this.shopifyService.shopifyRequest(
    shop.shopDomain,
    shop.accessToken,
    UPDATE_PRODUCT_SPECIFICATION_MUTATION,
    {
      metafields: [
        {
          ownerId: dto.productId,
          namespace: "custom",
          key: "specification",
          type: "json",
          value
        }
      ]
    }
  );

  const errors = response.metafieldsSet.userErrors;

  if (errors.length) {
    throw new Error(errors[0].message);
  }

  return {
    success: true,
    productId: dto.productId,
    specifications: dto.specifications
  };
}

async createMetafield(shopId: string, dto:CreateMetafieldDto) {

  const shop = await this.getShop(shopId);

  const res = await this.shopifyService.shopifyRequest(
    shop.shopDomain,
    shop.accessToken,
    CREATE_METAFIELD_DEFINITION,
    {
      definition: {
        name: dto.name,
        namespace: dto.namespace,
        key: dto.key,
        type: dto.type,
        ownerType: "PRODUCT",
        access: {
        storefront: "PUBLIC_READ",
      }
      }
    }
  );

  return res.metafieldDefinitionCreate;
}
async addProductMetafield(shopId: string, dto:AddProductMetafieldDto) {

  const shop = await this.getShop(shopId);

  const res = await this.shopifyService.shopifyRequest(
    shop.shopDomain,
    shop.accessToken,
    SET_PRODUCT_METAFIELD,
    {
      metafields: [
        {
          ownerId: dto.productId,
          namespace: dto.namespace,
          key: dto.key,
          type: dto.type,
          value: dto.value
        }
      ]
    }
  );

  if (res.metafieldsSet.userErrors.length) {
    throw new Error(res.metafieldsSet.userErrors[0].message);
  }

//   await this.historyModel.create({
//   shopId,
//   productId: dto.productId,
//   namespace: dto.namespace,
//   metafieldKey: dto.key,
//   oldValue: oldValue,
//   newValue: dto.value,
// });

  return res.metafieldsSet.metafields;
}

async getMetafields(shopId: string) {

  const shop = await this.getShop(shopId);

  const data = await this.shopifyService.shopifyRequest(
    shop.shopDomain,
    shop.accessToken,
    GET_METAFIELD_DEFINITIONS
  );

  return data.metafieldDefinitions.edges.map(e => e.node);
}
async generateSeoKeywords(shopId: string, dto: any) {

  const shop = await this.getShop(shopId);

  const prompt = `
You are an ecommerce SEO expert.

Analyze the product using:
- Title
- Description
- Product image

Generate SEO-friendly keywords for Shopify and search engines.

Return ONLY valid JSON.

Format:
{
  "primary_keywords": [],
}

Rules:
- Primary keywords: 5 most important product keywords

Product Title:
${dto.title}

`;

  const ai = await this.aiService.generateImageAnalysis(
    prompt,
    dto.imageUrl
  );

  console.log(ai);

  const jsonMatch = ai.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Invalid AI response");
  }

  return JSON.parse(jsonMatch[0]);
}

async checkSpecificationMetafield(shopId: string) {

  const shop = await this.getShop(shopId);

  let after: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {

    const data = await this.shopifyService.shopifyRequest(
      shop.shopDomain,
      shop.accessToken,
      CHECK_SPECIFICATION_DEFINITION_QUERY,
      {
        first: 100,
        after
      }
    );

    const definitions = data.metafieldDefinitions.edges;

    const spec = definitions.find(
      (e) =>
        e.node.namespace === "custom" &&
        e.node.key === "specification"
    );

    if (spec) {
      return [spec.node]; // return the metafield definition
    }

    hasNextPage = data.metafieldDefinitions.pageInfo.hasNextPage;
    after = data.metafieldDefinitions.pageInfo.endCursor;
  }

  return []; // not found
}

async checkMetafield(shopId: string,metaFieldName:string) {

  const shop = await this.getShop(shopId);

  let after: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {

    const data = await this.shopifyService.shopifyRequest(
      shop.shopDomain,
      shop.accessToken,
      CHECK_SPECIFICATION_DEFINITION_QUERY,
      {
        first: 100,
        after
      }
    );

    const definitions = data.metafieldDefinitions.edges;

    const spec = definitions.find(
      (e) =>
        e.node.namespace === "custom" &&
        e.node.key === metaFieldName
    );

    if (spec) {
      return [spec.node]; // return the metafield definition
    }

    hasNextPage = data.metafieldDefinitions.pageInfo.hasNextPage;
    after = data.metafieldDefinitions.pageInfo.endCursor;
  }

  return []; // not found
}
}