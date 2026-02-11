import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { groqClient } from '../../config/groq.config';
import { MetaTitle,MetaTitleDocument } from 'src/schema/meta-title/classic-meta-title.schema';
import { SaveMetaTitleDto } from 'src/dto/meta-title/save-meta-title.dto';
import { AiService } from 'src/config/ai.service';
import { PRODUCT_META_DESCRIPTION_AI_QUERY } from 'src/graphql/product-meta-description';
import { PRODUCT_META_TITLE_AI_QUERY } from 'src/graphql/product-meta-title';
import { UPDATE_PRODUCT_META_MUTATION } from 'src/graphql/update-product-meta-title';
import { ShopifyService } from 'src/common/shopify/shopify.service';
import { Shop } from 'src/schema/shop.schema';
import { OptimizeMetaTitleDto } from 'src/dto/meta-title/optimize-meta-title.dto';
import { buildMetaTitleAIPrompt } from 'src/common/buildMetaTitleAIPrompt';
import { SaveMetaDescriptionDto } from 'src/dto/meta-description/save-meta-description.dto';
import { MetaDescription,MetaDescriptionDocument } from 'src/schema/meta-description/classic-meta-description.schema';
import { OptimizeMetaDescriptionDto } from 'src/dto/meta-description/optimize-meta-description.dto';
import { OptimizeMetaHandleDto } from 'src/dto/meta-handle/optimize-meta-handle.dto';
import { SaveMetaHandleDto } from 'src/dto/meta-handle/save-meta-handle.dto';
import { PRODUCT_META_HANDLE_AI_QUERY } from 'src/graphql/product-meta-handle';
import { UPDATE_PRODUCT_Handle_MUTATION } from 'src/graphql/update-product-handle';
import { MetaHandle,MetaHandleDocument } from 'src/schema/meta-handle/classic-meta-handle.schema';
import { buildMetaDescriptionAIPrompt } from 'src/common/buildMetaDesAIPrompt';
import { buildProductHandleAIPrompt } from 'src/common/buildHandlePrompt';
@Injectable()
export class MetaService {
  constructor(
    @InjectModel(MetaTitle.name)
    private metaTitleOptimizedModel: Model<MetaTitleDocument>,

    @InjectModel(MetaDescription.name)
    private metadescriptionOptimizedModel: Model<MetaDescriptionDocument>,

    @InjectModel(MetaHandle.name)
    private metaHandleDocumentModel: Model<MetaHandleDocument>,
    private readonly aiService: AiService,

    private readonly shopifyService: ShopifyService,
    @InjectModel(Shop.name)
    private shopModel: Model<Shop>,
  ) {}

  // 🔹 AI Optimization
  async generateAIMetaTitle(
  shopId: string,
  dto: OptimizeMetaTitleDto,
) {
  const shop = await this.shopModel.findById(shopId).lean();
  if (!shop) throw new Error('Invalid shop');

  // 1️⃣ Fetch product (GraphQL)
  const productResponse = await this.shopifyService.shopifyRequest(
    shop.shopDomain,
    shop.accessToken,
    PRODUCT_META_TITLE_AI_QUERY,
    { id: dto.productId },
  );

  const product = productResponse.product;
  if (!product) throw new Error('Product not found');

  const oldMetaTitle =
    product.seo?.title || product.title;

  // 2️⃣ Build AI prompt
  const prompt = buildMetaTitleAIPrompt(product, dto);

  // 3️⃣ Call Groq AI
  let aiMetaTitle = await this.aiService.generateMetaTitle(prompt);

  // 4️⃣ Clean AI response
  aiMetaTitle = aiMetaTitle.replace(/["']/g, '').trim();

  // 5️⃣ Optional length enforcement (SEO best practice: ≤ 60 chars)
  // if (aiMetaTitle.length > 60) {
  //   aiMetaTitle = aiMetaTitle.slice(0, 60).trim();
  // }

  // 6️⃣ Apply immediately if requested
  if (dto.apply === true) {
    const applied = await this.applyMetaTitleOptimization(
      shopId,
      {
        productId: dto.productId,
        oldMetaTitle,
        newMetaTitle: aiMetaTitle,
      },
    );

    return {
      applied: true,
      productId: dto.productId,
      oldMetaTitle,
      newMetaTitle: aiMetaTitle,
      characterCount: aiMetaTitle.length,
      optimizationRecordId: applied._id,
    };
  }

  // 7️⃣ Preview response
  return {
    productId: dto.productId,
    oldMetaTitle,
    newMetaTitle: aiMetaTitle,
    characterCount: aiMetaTitle.length,
  };
}


  async generateAIMetaDescription(
  shopId: string,
  dto: OptimizeMetaDescriptionDto,
) {
  const shop = await this.shopModel.findById(shopId).lean();
  if (!shop) throw new Error('Invalid shop');

  // 1️⃣ Fetch product (GraphQL)
  const productResponse = await this.shopifyService.shopifyRequest(
    shop.shopDomain,
    shop.accessToken,
    PRODUCT_META_DESCRIPTION_AI_QUERY,
    { id: dto.productId },
  );

  const product = productResponse.product;
  if (!product) throw new Error('Product not found');

  const oldMetaDescription =
    product.seo?.description || product.description;

  // 2️⃣ Build AI prompt
  const prompt = buildMetaDescriptionAIPrompt(product, dto);

  // 3️⃣ Call Groq AI
  let aiMetaDescription = await this.aiService.generateMetaDescription(prompt);
  console.log(aiMetaDescription,"1")
  // 4️⃣ Clean AI response
  aiMetaDescription = aiMetaDescription.trim();

  // 5️⃣ Optional length enforcement (SEO best practice: ≤ 60 chars)
  // if (aiMetaDescription.length > 60) {
  //   aiMetaTitle = aiMetaTitle.slice(0, 60).trim();
  // }

  // 6️⃣ Apply immediately if requested
  if (dto.apply === true) {
    const applied = await this.applyMetaDescriptionOptimization(
      shopId,
      {
        productId: dto.productId,
        oldMetaDescription,
        newMetaDescription: aiMetaDescription,
      },
    );

    return {
      applied: true,
      productId: dto.productId,
      oldMetaDescription,
      newMetaDescription: aiMetaDescription,
      characterCount: aiMetaDescription.length,
      optimizationRecordId: applied._id,
    };
  }

  // 7️⃣ Preview response
  return {
    productId: dto.productId,
    oldMetaDescription,
    newMetaDescription: aiMetaDescription,
    characterCount: aiMetaDescription.length,
  };
}

async generateAIMetaHandle(
  shopId: string,
  dto: OptimizeMetaHandleDto,
) {
  const shop = await this.shopModel.findById(shopId).lean();
  if (!shop) throw new Error('Invalid shop');

  // 1️⃣ Fetch product (GraphQL)
  const productResponse = await this.shopifyService.shopifyRequest(
    shop.shopDomain,
    shop.accessToken,
    PRODUCT_META_HANDLE_AI_QUERY,
    { id: dto.productId },
  );

  const product = productResponse.product;
  if (!product) throw new Error('Product not found');

  const oldMetaHandle =
    product.Handle || '';

  // 2️⃣ Build AI prompt
  const prompt = buildProductHandleAIPrompt(product, dto);

  // 3️⃣ Call Groq AI
  let aiMetaHandle = await this.aiService.generateMetaDescription(prompt);

  // 4️⃣ Clean AI response
  aiMetaHandle = aiMetaHandle.trim();

  // 6️⃣ Apply immediately if requested
  if (dto.apply === true) {
    const applied = await this.applyMetaHandleOptimization(
      shopId,
      {
        productId: dto.productId,
        oldMetaHandle,
        newMetaHandle: aiMetaHandle,
      },
    );

    return {
      applied: true,
      productId: dto.productId,
      oldMetaHandle,
      newMetaHandle: aiMetaHandle,
      characterCount: aiMetaHandle.length,
      optimizationRecordId: applied._id,
    };
  }

  // 7️⃣ Preview response
  return {
    productId: dto.productId,
    oldMetaHandle,
    newMetaHandle: aiMetaHandle,
    characterCount: aiMetaHandle.length,
  };
}


  
  async applyMetaTitleOptimization(
  shopId: string,
  dto: SaveMetaTitleDto,
) {
  const shop = await this.shopModel.findById(shopId).lean();
  if (!shop) throw new Error('Invalid shop');

  // 1️⃣ Update Shopify SEO Meta Title
  const response = await this.shopifyService.shopifyRequest(
    shop.shopDomain,
    shop.accessToken,
    UPDATE_PRODUCT_META_MUTATION,
    {
      input: {
        id: dto.productId,
        seo: {
          title: dto.newMetaTitle,
        },
      },
    },
  );

  const errors = response.productUpdate.userErrors;
  if (errors.length) throw errors;

  // 2️⃣ Store optimization history
  return this.metaTitleOptimizedModel.create({
    shopId,
    productId: dto.productId,
    oldMetaTitle: dto.oldMetaTitle,
    newMetaTitle: dto.newMetaTitle,
    appliedToShopify:true
  });
}


 async applyMetaDescriptionOptimization(
  shopId: string,
  dto: SaveMetaDescriptionDto,
) {
  const shop = await this.shopModel.findById(shopId).lean();
  if (!shop) throw new Error('Invalid shop');

  // 1️⃣ Update Shopify SEO Meta Title
  const response = await this.shopifyService.shopifyRequest(
    shop.shopDomain,
    shop.accessToken,
    UPDATE_PRODUCT_META_MUTATION,
    {
      input: {
        id: dto.productId,
        seo: {
          description: dto.newMetaDescription,
        },
      },
    },
  );

  const errors = response.productUpdate.userErrors;
  if (errors.length) throw errors;

  // 2️⃣ Store optimization history
  return this.metadescriptionOptimizedModel.create({
    shopId,
    productId: dto.productId,
    oldMetaDescription: dto.oldMetaDescription,
    newMetaDescription: dto.newMetaDescription,
    appliedToShopify:true
  });
}

 async applyMetaHandleOptimization(
  shopId: string,
  dto: SaveMetaHandleDto,
) {
  const shop = await this.shopModel.findById(shopId).lean();
  if (!shop) throw new Error('Invalid shop');

  // 1️⃣ Update Shopify SEO Meta Title
  const response = await this.shopifyService.shopifyRequest(
    shop.shopDomain,
    shop.accessToken,
    UPDATE_PRODUCT_Handle_MUTATION,
    {
      input: {
        id: dto.productId,
        handle:dto.newMetaHandle
      },
    },
  );

  const errors = response.productUpdate.userErrors;
  if (errors.length) throw errors;

  // 2️⃣ Store optimization history
  return this.metaHandleDocumentModel.create({
    shopId,
    productId: dto.productId,
    oldMetaHandle: dto.oldMetaHandle,
    newMetaHandle: dto.newMetaHandle,
    appliedToShopify:true
  });
}

}
