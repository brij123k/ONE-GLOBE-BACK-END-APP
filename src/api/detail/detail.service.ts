import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiService } from 'src/config/ai.service';
import { ShopifyService } from 'src/common/shopify/shopify.service';
import { PRODUCT_BY_ID_QUERY } from 'src/graphql/product-by-id.query';
import { UPDATE_IMAGE_ALT_MUTATION } from 'src/graphql/update-image-alt.mutation';
import { UPDATE_IMAGE_NAME_MUTATION } from 'src/graphql/create-product-image.mutation';
import { UPDATE_PRODUCT_DETAIL_MUTATION } from 'src/graphql/update-product-detail.mutation';
import { OptimizeDetailDto } from 'src/dto/detail/optimize-detail.dto';
import { SaveDetailDto } from 'src/dto/detail/save-detail.dto';
import { DetailHistory } from 'src/schema/detail/detail-history.schema';
import { DetailOptimization } from 'src/schema/detail/detail-optimization.schema';
import { Shop } from 'src/schema/shop.schema';

@Injectable()
export class DetailService {
  constructor(
    private readonly aiService: AiService,
    private readonly shopifyService: ShopifyService,

    @InjectModel(Shop.name)
    private shopModel: Model<Shop>,

    @InjectModel(DetailOptimization.name)
    private detailModel: Model<DetailOptimization>,

    @InjectModel(DetailHistory.name)
    private detailHistoryModel: Model<DetailHistory>,
  ) {}

  private async getShop(shopId: string) {
    const shop = await this.shopModel.findById(shopId).lean();
    if (!shop) throw new Error('Invalid shop');
    return shop;
  }

  private getImageExtension(url: string): string {
    try {
      const cleanUrl = url.split('?')[0];
      const parts = cleanUrl.split('.');
      return parts[parts.length - 1] || 'jpg';
    } catch {
      return 'jpg';
    }
  }

  private getImageName(url?: string): string {
    if (!url) return '';
    const file = url.split('/').pop()?.split('?')[0] || '';
    return file.replace(/\.[^/.]+$/, '');
  }

  private cleanHandle(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private cleanImageName(value: string): string {
    return this.cleanHandle(value).replace(/^-|-$/g, '');
  }

  private parseJsonResponse(raw: string) {
    if (!raw?.trim()) {
      throw new BadRequestException('AI returned an empty detail response');
    }

    const cleaned = raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start === -1 || end === -1) {
      throw new BadRequestException('AI did not return valid detail JSON');
    }

    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      throw new BadRequestException('AI returned malformed detail JSON');
    }
  }

  private buildPrompt(
    product: any,
    image: any,
    dto: OptimizeDetailDto,
  ): string {
    return `
Create one optimized Shopify detail response for this product.
Use the product image as the main source when available, then use the product data for context.

Return JSON only with this exact shape:
{
  "title": "optimized product title",
  "description": "optimized HTML product description",
  "metaTitle": "SEO meta title under 60 characters",
  "metaDescription": "SEO meta description under 160 characters",
  "handle": "seo-url-handle",
  "imageAlt": "SEO image alt text",
  "imageName": "seo-image-file-name-without-extension"
}

Product data:
- Current title: ${product.title || ''}
- Current description: ${product.description || product.descriptionHtml || ''}
- Current meta title: ${product.seo?.title || ''}
- Current meta description: ${product.seo?.description || ''}
- Current handle: ${product.handle || ''}
- Vendor: ${product.vendor || ''}
- Product type: ${product.productType || ''}
- Tags: ${(product.tags || []).join(', ')}
- Selected image alt: ${image?.alt || ''}
- Selected image URL: ${image?.image?.url || ''}

Rules:
- Do not invent brand names, material, color, size, or features that are not visible in the image or present in product data.
- Make the title readable for shoppers and useful for SEO.
- Make the description valid Shopify HTML with short paragraphs or bullet list tags.
- Make the handle and imageName lowercase with hyphens only.
- Keep imageAlt natural, descriptive, and under 125 characters.
- Respect source toggles: image=${dto.image ?? true}, title=${dto.title ?? true}, description=${dto.description ?? true}.

Description BLOCK RULES:
- Do not use heading tags: no <h1>, <h2>, <h3>, <h4>, <h5>, or <h6>
- If a block needs a heading/title, write it as <p><strong>Heading text</strong></p>
- Use <p> for text, <ul><li> for features/specs
- Do not skip/add blocks

Strict title Instructions:
- Never include the pipe character: |
- No quotes
- No explanations
- No emojis
- No markdown
`;
  }

  async getStoredProducts(shopId: string) {
    return this.detailModel.find({ shopId }).lean();
  }

  async optimizeDetail(shopId: string, dto: OptimizeDetailDto) {
    const shop = await this.getShop(shopId);
    const productResponse = await this.shopifyService.shopifyRequest(
      shop.shopDomain,
      shop.accessToken,
      PRODUCT_BY_ID_QUERY,
      { id: dto.productId },
    );

    const product = productResponse.product;
    if (!product) throw new Error('Product not found');
    const images =
      product.media?.edges
        ?.filter((edge: any) => edge.node.mediaContentType === 'IMAGE')
        ?.map((edge: any) => edge.node) || [];
    let selectedImage =
      images.find((image: any) => image.id === dto.imageId) || images[0];
    let imageUrl = selectedImage?.image?.url || null;
    const useImage = dto.image ?? true;

    if (useImage && !imageUrl) {
      imageUrl = product.featuredMedia?.preview?.image?.url || null;
      selectedImage = imageUrl
        ? {
            id: product.featuredMedia?.id || dto.imageId || null,
            alt: '',
            image: { url: imageUrl },
          }
        : null;
    }

    const prompt = this.buildPrompt(product, selectedImage, dto);
    const raw = await this.aiService.generateDetailOptimization(
      prompt,
      useImage ? imageUrl : null,
    );
    const generated = this.parseJsonResponse(raw);

    const optimized = {
      title: String(generated.title || product.title || '')
        .replace(/["']/g, '')
        .trim(),
      description: String(
        generated.description || product.descriptionHtml || '',
      ).trim(),
      metaTitle: String(
        generated.metaTitle || product.seo?.title || product.title || '',
      )
        .replace(/["']/g, '')
        .trim()
        .slice(0, 60),
      metaDescription: String(
        generated.metaDescription || product.seo?.description || '',
      )
        .trim()
        .slice(0, 160),
      handle: this.cleanHandle(
        String(generated.handle || product.handle || ''),
      ),
      imageAlt: String(generated.imageAlt || selectedImage?.alt || '')
        .replace(/["']/g, '')
        .trim()
        .slice(0, 125),
      imageName: this.cleanImageName(
        String(generated.imageName || this.getImageName(imageUrl)),
      ),
    };

    const response = {
      productId: dto.productId,
      imageAnalyzed: useImage && Boolean(imageUrl),
      oldValues: {
        title: product.title || '',
        description: product.descriptionHtml || '',
        metaTitle: product.seo?.title || product.title || '',
        metaDescription: product.seo?.description || '',
        handle: product.handle || '',
        imageAlt: selectedImage?.alt || '',
        imageName: this.getImageName(imageUrl),
      },
      newValues: optimized,
      images: selectedImage?.id
        ? [
            {
              imageId: selectedImage.id,
              imageUrl,
              oldAlt: selectedImage.alt || '',
              newAlt: optimized.imageAlt,
              oldName: this.getImageName(imageUrl),
              newName: optimized.imageName,
            },
          ]
        : [],
    };

    if (dto.apply === true) {
      const applied = await this.saveToShopify(shopId, {
        productId: dto.productId,
        oldTitle: response.oldValues.title,
        newTitle: optimized.title,
        oldDescription: response.oldValues.description,
        newDescription: optimized.description,
        oldMetaTitle: response.oldValues.metaTitle,
        newMetaTitle: optimized.metaTitle,
        oldMetaDescription: response.oldValues.metaDescription,
        newMetaDescription: optimized.metaDescription,
        oldHandle: response.oldValues.handle,
        newHandle: optimized.handle,
        images: response.images,
      });

      return {
        applied: true,
        ...response,
        result: applied,
      };
    }

    return response;
  }

  async saveToShopify(shopId: string, dto: SaveDetailDto) {
    const shop = await this.getShop(shopId);
    const input: Record<string, any> = {
      id: dto.productId,
    };

    if (dto.newTitle) input.title = dto.newTitle;
    if (dto.newDescription) input.descriptionHtml = dto.newDescription;
    if (dto.newHandle) input.handle = this.cleanHandle(dto.newHandle);

    const seo: Record<string, string> = {};
    if (dto.newMetaTitle) seo.title = dto.newMetaTitle;
    if (dto.newMetaDescription) seo.description = dto.newMetaDescription;
    if (Object.keys(seo).length) input.seo = seo;

    let productResult: any = null;
    if (Object.keys(input).length > 1) {
      productResult = await this.shopifyService.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        UPDATE_PRODUCT_DETAIL_MUTATION,
        { input },
      );

      const errors = productResult.productUpdate.userErrors;
      if (errors?.length) throw errors;
    }

    const imageResults: any[] = [];
    for (const image of dto.images || []) {
      const fileInput: Record<string, string> = { id: image.imageId };

      if (image.newAlt) fileInput.alt = image.newAlt;
      if (image.newName) {
        fileInput.filename = `${this.cleanImageName(image.newName)}.${this.getImageExtension(
          image.imageUrl,
        )}`;
      }

      if (Object.keys(fileInput).length === 1) continue;

      const mutation = fileInput.filename
        ? UPDATE_IMAGE_NAME_MUTATION
        : UPDATE_IMAGE_ALT_MUTATION;
      const imageResult = await this.shopifyService.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        mutation,
        { files: [fileInput] },
      );

      const errors = imageResult.fileUpdate.userErrors;
      imageResults.push({
        imageId: image.imageId,
        status: errors?.length ? 'failed' : 'updated',
        errors,
      });
    }

    await this.detailModel.findOneAndUpdate(
      { shopId, productId: dto.productId },
      {
        $set: {
          title: dto.newTitle,
          description: dto.newDescription,
          descriptionHtml: dto.newDescription,
          metaTitle: dto.newMetaTitle,
          metaDescription: dto.newMetaDescription,
          handle: dto.newHandle,
          optimized: true,
        },
      },
      { new: true },
    );

    const history = await this.detailHistoryModel.create({
      shopId,
      productId: dto.productId,
      oldValues: {
        title: dto.oldTitle,
        description: dto.oldDescription,
        metaTitle: dto.oldMetaTitle,
        metaDescription: dto.oldMetaDescription,
        handle: dto.oldHandle,
        images: dto.images?.map((image) => ({
          imageId: image.imageId,
          alt: image.oldAlt,
          name: image.oldName,
        })),
      },
      newValues: {
        title: dto.newTitle,
        description: dto.newDescription,
        metaTitle: dto.newMetaTitle,
        metaDescription: dto.newMetaDescription,
        handle: dto.newHandle,
        images: dto.images?.map((image) => ({
          imageId: image.imageId,
          alt: image.newAlt,
          name: image.newName,
        })),
      },
      appliedToShopify: true,
    });

    return {
      message: 'Detail optimization saved to Shopify',
      productUpdated: Boolean(productResult),
      imageResults,
      historyId: history._id,
    };
  }
}
