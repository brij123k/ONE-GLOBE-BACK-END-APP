import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { buildBulkImageAIPrompt } from 'src/common/buildBulkImageAIPrompt';
import { ShopifyService } from 'src/common/shopify/shopify.service';
import { AiService } from 'src/config/ai.service';
import { AIBulkImageOptimizationDto } from 'src/dto/image/ai-image-optimization.dto';
import { ApplyImageOptimizationDto } from 'src/dto/image/apply-image-optimization.dto';
import { AIGeneratedImageAltDto } from 'src/dto/image/ai-generated-image-alt.dto';
import { UPDATE_PRODUCT_IMAGES_ALT_MUTATION } from 'src/graphql/product-image-ALT-update';
import { PRODUCT_WITH_IMAGES_QUERY } from 'src/graphql/product-image.query';
import { PRODUCT_IMAGES_WITH_VARIANTS_QUERY } from 'src/graphql/product_images_with_variant_query';
import { ImageOptimized } from 'src/schema/image/image-optimized.schema';
import { Shop } from 'src/schema/shop.schema';



@Injectable()
export class ImageSeoService {
    constructor(
        @InjectModel(ImageOptimized.name)
        private imageOptimizedModel: Model<ImageOptimized>,

        private readonly shopifyService: ShopifyService,
        private readonly aiService: AiService,
        @InjectModel(Shop.name)
        private shopModel: Model<Shop>,
    ) { }

    async generateAIBulkImageSEO(
        shopId: string,
        dto: AIBulkImageOptimizationDto,
    ) {
        const shop = await this.shopModel.findById(shopId).lean();
        if (!shop) throw new Error('Invalid shop');

        // 1️⃣ Fetch product with images + variants
        const response = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            PRODUCT_IMAGES_WITH_VARIANTS_QUERY,
            { id: dto.productId },
        );

        const product = response.product;
        if (!product) throw new Error('Product not found');

        const images = product.images.edges.map(e => e.node);
        const variants = product.variants.edges.map(e => e.node);

        const results: AIGeneratedImageAltDto[] = [];

        // 2️⃣ Loop images → AI ALT
        for (const image of images) {
            const relatedVariants = variants.filter(
                v => v.image?.id === image.id,
            );

            const prompt = buildBulkImageAIPrompt({
                productTitle: product.title,
                vendor: product.vendor,
                variantTitles: relatedVariants.map(v => v.title),
                existingAlt: image.altText,
            });

            const aiAlt = await this.aiService.generateImageAlt(prompt);

            results.push({
                imageId: image.id,
                oldAlt: image.altText || '',
                newAlt: aiAlt,
                variants: relatedVariants.map(v => ({
                    id: v.id,
                    title: v.title,
                })),
            });
        }

        // 3️⃣ Preview only
        if (!dto.apply) {
            return {
                productId: dto.productId,
                productTitle: product.title,
                images: results,
            };
        }

        // 4️⃣ Apply all images ALT (bulk)
        await this.applyImageOptimization(shopId, {
            productId: dto.productId,
            images: results.map(img => ({
                imageId: img.imageId,
                oldAlt: img.oldAlt,
                newAlt: img.newAlt,
            })),
        });

        return {
            applied: true,
            productId: dto.productId,
            updatedImages: results.length,
        };
    }


async applyImageOptimization(
  shopId: string,
  dto: {
    productId: string;
    images: {
      imageId: string;
      oldAlt?: string;
      newAlt: string;
    }[];
  },
) {
  const shop = await this.shopModel.findById(shopId).lean();
  if (!shop) throw new Error('Invalid shop');

  if (!dto.images || !dto.images.length) {
    throw new Error('No images provided');
  }

  // 🔒 Validate payload (STRICT)
  for (const img of dto.images) {
    if (!img.imageId) {
      throw new Error('imageId is missing');
    }

    if (!img.newAlt || !img.newAlt.trim()) {
      throw new Error(
        `ALT text missing for image ${img.imageId}`,
      );
    }
  }

  // 1️⃣ Fetch product images ONCE (needed for ID resolution)
  const productResponse = await this.shopifyService.shopifyRequest(
    shop.shopDomain,
    shop.accessToken,
    PRODUCT_IMAGES_WITH_VARIANTS_QUERY,
    { id: dto.productId },
  );

  const product = productResponse.product;
  if (!product) throw new Error('Product not found');

  const productImages = product.images.edges.map(e => e.node);

  // 2️⃣ Update Shopify IMAGES ONE BY ONE (SAFE)
  for (const img of dto.images) {
    // ✅ Resolve MediaImage ID (supports ProductImage & MediaImage)
    const mediaId = this.resolveMediaImageId(
      productImages,
      img.imageId,
    );

    console.log('Updating image ALT:', {
      productId: dto.productId,
      mediaId,
      alt: img.newAlt,
    });

    const result = await this.shopifyService.shopifyRequest(
      shop.shopDomain,
      shop.accessToken,
      UPDATE_PRODUCT_IMAGES_ALT_MUTATION,
      {
        productId: dto.productId,
        mediaId,
        alt: img.newAlt,
      },
    );

    const errors = result.productUpdateMedia?.mediaUserErrors;
    if (errors && errors.length) {
      throw errors;
    }
  }

  // 3️⃣ Update DB (single document, per image)
  for (const img of dto.images) {
    await this.imageOptimizedModel.updateOne(
      {
        shopId,
        productId: dto.productId,
        'images.imageId': img.imageId,
      },
      {
        $set: {
          'images.$.altText': img.newAlt,
        },
      },
    );
  }

  return {
    success: true,
    productId: dto.productId,
    updatedCount: dto.images.length,
  };
}

private resolveMediaImageId(
  productImages: any[],
  incomingImageId: string,
): string {
  // Already MediaImage
  if (incomingImageId.startsWith('gid://shopify/MediaImage/')) {
    return incomingImageId;
  }

  // ProductImage → MediaImage
  if (incomingImageId.startsWith('gid://shopify/ProductImage/')) {
    const numericId = incomingImageId.split('/').pop();

    const match = productImages.find(
      img =>
        img.legacyResourceId &&
        img.legacyResourceId.toString() === numericId,
    );

    if (!match) {
      throw new Error(
        `Cannot resolve MediaImage ID for ${incomingImageId}`,
      );
    }

    return match.id; // MediaImage ID
  }

  throw new Error(`Unsupported imageId: ${incomingImageId}`);
}


}
