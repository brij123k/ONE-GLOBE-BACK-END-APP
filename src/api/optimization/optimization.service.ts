import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { OptimizedDescription } from 'src/schema/descriptions/optimized-description.schema';
import { StoreOptimizationDto } from 'src/dto/store-optimization.dto';
import { Shop } from 'src/schema/shop.schema';
import { OptimizedTitle } from 'src/schema/title/optimized-title.schema';
import { PRODUCT_BY_ID_QUERY } from 'src/graphql/product-by-id.query';
import { ApplyTitleOptimizationDto } from 'src/dto/title/apply-title-optimization.dto';
import { UPDATE_PRODUCT_TITLE_MUTATION } from 'src/graphql/update-product-title';
import { ApplyDescriptionOptimizationDto } from 'src/dto/description/apply-description-optimization.dto';
import { UPDATE_PRODUCT_DESCRIPTION_MUTATION } from 'src/graphql/update-product-description';
import { ClassicDescriptionOptimized } from 'src/schema/descriptions/classic-description-optimized.schema';
import { ClassicTitleOptimized } from 'src/schema/title/classic-title-optimized.schema';
import { ShopifyService } from 'src/common/shopify/shopify.service';
import { AITitleOptimizationDto } from 'src/dto/title/ai-title-optimization.dto';
import { PRODUCT_TITLE_AI_QUERY } from 'src/graphql/product-title-ai';
import { buildTitleAIPrompt } from 'src/common/build-title-ai-prompt';
import { AiService } from 'src/config/ai.service';
import { AIDescriptionOptimizationDto } from 'src/dto/description/ai-title-optimization.dto';
import { buildDescriptionAIPrompt } from 'src/common/buildDescriptionAIPrompt';
import { PRODUCT_DESCRIPTION_AI_QUERY } from 'src/graphql/product-description-ai';
import { OptimizedMetaTitle } from 'src/schema/meta-title/optimized-meta-title.schema';
import { OptimizedMetaDescription } from 'src/schema/meta-description/optimized-meta-description.schema';
import { OptimizedMetaHandle } from 'src/schema/meta-handle/optimized-meta-handle.schema';
import { OptimizedPricing } from 'src/schema/pricing/optimized-pricing.schema';
@Injectable()
export class OptimizationService {
    constructor(
        private readonly shopifyService: ShopifyService,
        private readonly aiService: AiService,

        @InjectModel(OptimizedTitle.name)
        private titleModel: Model<OptimizedTitle>,

        @InjectModel(ClassicTitleOptimized.name)
        private classicTitleOptimizedModel: Model<ClassicTitleOptimized>,

        @InjectModel(ClassicDescriptionOptimized.name)
        private classicDescriptionOptimizedModel: Model<ClassicDescriptionOptimized>,

        @InjectModel(OptimizedDescription.name)
        private descriptionModel: Model<OptimizedDescription>,

        @InjectModel(OptimizedMetaTitle.name)
        private MetaTitleModel: Model<OptimizedMetaTitle>,

        @InjectModel(OptimizedMetaDescription.name)
        private MetaDescriptionModel: Model<OptimizedMetaDescription>,

        @InjectModel(OptimizedMetaHandle.name)
        private MetaHandleModel: Model<OptimizedMetaHandle>,

        @InjectModel(OptimizedPricing.name)
        private pricingModel: Model<OptimizedPricing>,

        @InjectModel(Shop.name)
        private shopModel: Model<Shop>,
    ) { }

    private getModel(serviceName: string) {
        const map = {
            title: this.titleModel,
            description: this.descriptionModel,
            metaTitle: this.MetaTitleModel,
            metaDescription: this.MetaDescriptionModel,
            handle: this.MetaHandleModel,
            pricing: this.pricingModel,
        };

        return map[serviceName];
    }

    private async getShop(shopId: string) {
        const shop = await this.shopModel.findById(shopId).lean();
        if (!shop) throw new Error('Invalid shop');
        return shop;
    }

    private async fetchProduct(shopDomain: string, token: string, productId: string) {
        const url = `https://${shopDomain}/admin/api/2026-01/graphql.json`;

        const { data } = await axios.post(
            url,
            {
                query: PRODUCT_BY_ID_QUERY,
                variables: { id: productId },
            },
            {
                headers: { 'X-Shopify-Access-Token': token },
            },
        );

        return data.data.product;
    }

    async storeProducts(shopId: string, dto: StoreOptimizationDto) {
        const shop = await this.getShop(shopId);

        const model = this.getModel(dto.serviceName);
        if (!model) throw new Error('Invalid service name');

        await model.deleteMany({ shopId });

        const documents: any[] = [];

        for (const productId of dto.productIds) {
            const product = await this.fetchProduct(
                shop.shopDomain,
                shop.accessToken,
                productId,
            );

            if (!product) continue;

            const image = product.featuredMedia?.preview?.image?.url || null;

            switch (dto.serviceName) {
                case 'title':
                    documents.push({ shopId, productId, productImage: image, title: product.title });
                    break;

                case 'description':
                    documents.push({
                        shopId,
                        productId,
                        productImage: image,
                        description: product.descriptionHtml || '',
                        descriptionHtml: product.descriptionHtml || '',
                    });
                    break;

                case 'metaTitle':
                    documents.push({
                        shopId,
                        productId,
                        productImage: image,
                        title: product.title,
                        metaTitle: product.seo?.title || product.title,
                    });
                    break;

                case 'metaDescription':
                    documents.push({
                        shopId,
                        productId,
                        productImage: image,
                        description: product.description || '',
                        metaDescription: product.seo?.description || '',
                    });
                    break;

                case 'handle':
                    documents.push({
                        shopId,
                        productId,
                        productImage: image,
                        title: product.title,
                        metaHandle: product.handle || '',
                    });
                    break;

                case 'pricing':
                    const variants = product.variants?.edges?.map(v => {
                        const node = v.node;

                        return {
                            variantId: node.id,
                            title: node.title,
                            sku: node.sku,
                            image: node.image?.url || null,
                            price: Number(node.price || 0),
                            compareAtPrice: Number(node.compareAtPrice || 0),
                            costPrice: Number(node.inventoryItem?.unitCost?.amount || 0),
                            inventoryQuantity: node.inventoryQuantity || 0,
                        };
                    }) || [];

                    documents.push({
                        shopId,
                        productId,
                        title: product.title,
                        productImage: image,
                        variants,
                    });
                    break;
            }
        }

        const inserted = documents.length ? await model.insertMany(documents) : [];

        return {
            shopId,
            serviceName: dto.serviceName,
            deletedOld: true,
            insertedCount: inserted.length,
            products: inserted,
        };
    }

    // =====================================================
    // 📦 GET STORED DATA
    // =====================================================
    async getOptimizedProducts(shopId: string, serviceName: string) {
        const model = this.getModel(serviceName);
        if (!model) throw new Error('Invalid service name');
        return model.find({ shopId }).lean();
    }

    // =====================================================
    // ✏️ APPLY TITLE
    // =====================================================
    async applyTitleOptimization(shopId: string, dto: ApplyTitleOptimizationDto) {
        const shop = await this.getShop(shopId);

        const response = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            UPDATE_PRODUCT_TITLE_MUTATION,
            { input: { id: dto.productId, title: dto.newTitle } },
        );

        const errors = response.productUpdate.userErrors;
        if (errors.length) throw errors;

        return this.classicTitleOptimizedModel.create({
            shopId,
            productId: dto.productId,
            oldTitle: dto.oldTitle,
            newTitle: dto.newTitle,
        });
    }

    // =====================================================
    // ✏️ APPLY DESCRIPTION
    // =====================================================
    async applyDescriptionOptimization(shopId: string, dto: ApplyDescriptionOptimizationDto) {
        const shop = await this.getShop(shopId);

        const response = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            UPDATE_PRODUCT_DESCRIPTION_MUTATION,
            { input: { id: dto.productId, descriptionHtml: dto.newDescription } },
        );

        const errors = response.productUpdate.userErrors;
        if (errors.length) throw errors;

        return this.classicDescriptionOptimizedModel.create({
            shopId,
            productId: dto.productId,
            oldDescription: dto.oldDescription,
            newDescription: dto.newDescription,
        });
    }

    // =====================================================
    // 🤖 AI TITLE
    // =====================================================
    async generateAITitle(shopId: string, dto: AITitleOptimizationDto) {
        const shop = await this.getShop(shopId);

        const productResponse = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            PRODUCT_TITLE_AI_QUERY,
            { id: dto.productId },
        );

        const product = productResponse.product;
        if (!product) throw new Error('Product not found');

        const prompt = buildTitleAIPrompt(product, dto);

        let aiTitle = await this.aiService.generateTitle(prompt);
        aiTitle = aiTitle.replace(/["']/g, '').trim();

        if (dto.apply === true) {
            const applied = await this.applyTitleOptimization(shopId, {
                productId: dto.productId,
                oldTitle: product.title,
                newTitle: aiTitle,
            });

            return {
                applied: true,
                productId: dto.productId,
                oldTitle: product.title,
                newTitle: aiTitle,
                characterCount: aiTitle.length,
                image: product.featuredMedia?.preview?.image?.url || null,
                optimizationRecordId: applied._id,
            };
        }

        return {
            productId: dto.productId,
            oldTitle: product.title,
            newTitle: aiTitle,
            characterCount: aiTitle.length,
            image: product.featuredMedia?.preview?.image?.url || null,
        };
    }

    // =====================================================
    // 🤖 AI DESCRIPTION
    // =====================================================
    async generateAIDescription(shopId: string, dto: AIDescriptionOptimizationDto) {
        const shop = await this.getShop(shopId);

        const productResponse = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            PRODUCT_DESCRIPTION_AI_QUERY,
            { id: dto.productId },
        );

        const product = productResponse.product;
        if (!product) throw new Error('Product not found');

        const prompt = buildDescriptionAIPrompt(product, dto);

        let aiDescription = await this.aiService.generateDescription(prompt);
        aiDescription = aiDescription.trim();

        if (dto.apply === true) {
            const applied = await this.applyDescriptionOptimization(shopId, {
                productId: dto.productId,
                oldDescription: product.description,
                newDescription: aiDescription,
            });

            return {
                applied: true,
                productId: dto.productId,
                oldDescription: product.descriptionHtml,
                newDescription: aiDescription,
                characterCount: aiDescription.length,
                image: product.featuredMedia?.preview?.image?.url || null,
                optimizationRecordId: applied._id,
            };
        }

        return {
            productId: dto.productId,
            oldDescription: product.descriptionHtml,
            newDescription: aiDescription,
            characterCount: aiDescription.length,
            image: product.featuredMedia?.preview?.image?.url || null,
        };
    }
}
