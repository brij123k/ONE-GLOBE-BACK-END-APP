import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { groqClient } from '../../config/groq.config';
import { MetaTitle,MetaTitleDocument } from 'src/schema/meta-title/classic-meta-title.schema';
import { SaveMetaTitleDto } from 'src/dto/meta-title/save-meta-title.dto';
import { AiService } from 'src/config/ai.service';
import { PRODUCT_META_TITLE_AI_QUERY } from 'src/graphql/product-meta-title';
import { UPDATE_PRODUCT_META_MUTATION } from 'src/graphql/update-product-meta-title';
import { ShopifyService } from 'src/common/shopify/shopify.service';
import { Shop } from 'src/schema/shop.schema';
import { OptimizeMetaTitleDto } from 'src/dto/meta-title/optimize-meta-title.dto';
import { buildMetaTitleAIPrompt } from 'src/common/buildMetaTitleAIPrompt';
@Injectable()
export class MetaService {
  constructor(
    @InjectModel(MetaTitle.name)
    private metaTitleOptimizedModel: Model<MetaTitleDocument>,
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
  if (aiMetaTitle.length > 60) {
    aiMetaTitle = aiMetaTitle.slice(0, 60).trim();
  }

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

}
