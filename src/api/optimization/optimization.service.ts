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
import { ImageOptimization } from 'src/schema/image/optimized-image.schema';
import { PRODUCT_IMAGES_WITH_VARIANTS_QUERY } from 'src/graphql/product_images_with_variant_query';
import { StoreImageOptimizationDto } from 'src/dto/image/store-image-optimization.dto';
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

        @InjectModel(ImageOptimization.name)
        private optimizedImage: Model<ImageOptimization>,

        @InjectModel(Shop.name)
        private shopModel: Model<Shop>,
    ) { }

    private async fetchProduct(shopDomain: string, token: string, productId: string) {
        const url = `https://${shopDomain}/admin/api/2026-01/graphql.json`;

        const { data } = await axios.post(
            url,
            {
                query: PRODUCT_BY_ID_QUERY,
                variables: { id: productId },
            },
            {
                headers: {
                    'X-Shopify-Access-Token': token,
                },
            },
        );

        return data.data.product;
    }

    async storeProducts(shopId: string, dto: StoreOptimizationDto) {
        // if(dto.serviceName==="image"){
        //     this.storeForImageOptimization(shopId,dto.productIds)
        // }
        const shop = await this.shopModel.findById(shopId).lean();
        if (!shop) throw new Error('Invalid shop');

        // 🔥 STEP 1: DELETE OLD DATA (PER SHOP + SERVICE)
        if (dto.serviceName === 'title') {
            await this.titleModel.deleteMany({ shopId });
        }

        if (dto.serviceName === 'description') {
            await this.descriptionModel.deleteMany({ shopId });
        }
        if (dto.serviceName === 'metaTitle') {
            await this.MetaTitleModel.deleteMany({ shopId });
        }
        if (dto.serviceName === 'metaDescription') {
            await this.MetaDescriptionModel.deleteMany({ shopId });
        }
        if (dto.serviceName === 'image') {
            await this.optimizedImage.deleteMany({ shopId })
        }

        // 🔥 STEP 2: PREPARE BULK INSERT DATA
        const documents: any[] = [];

        for (const productId of dto.productIds) {
            const product = await this.fetchProduct(
                shop.shopDomain,
                shop.accessToken,
                productId,
            );
            console.log(product)
            if (!product) continue;
            const image = product.featuredMedia?.preview?.image?.url || null;

            // const image = product.

            if (dto.serviceName === 'title') {
                documents.push({
                    shopId,
                    productId,
                    productImage: image,
                    title: product.title,
                });
            }

            if (dto.serviceName === 'description') {
                documents.push({
                    shopId,
                    productId,
                    productImage: image,
                    description: product.descriptionHtml || product.description,
                    descriptionHtml: product.descriptionHtml || product.title,
                });
            }
            if (dto.serviceName === 'metaTitle') {
                documents.push({
                    shopId,
                    productId,
                    productImage: image,
                    title: product.title,
                    metaTitle: product.seo.title || product.title,
                });
            }
            if (dto.serviceName === 'metaDescription') {
                documents.push({
                    shopId,
                    productId,
                    productImage: image,
                    description: product.description || product.title,
                    metaDescription: product.seo.description || '',
                });
            }
            // if (dto.serviceName === 'image') {
            //     const imageData = await this.fetchProductImagesForOptimization(
            //         shop.shopDomain,
            //         shop.accessToken,
            //         productId,
            //     );

            //     if (!imageData) continue;

            //     documents.push({
            //         shopId,
            //         productId,
            //         productTitle: imageData.productTitle,
            //         images: imageData.images,
            //     });
            // }
        }

        // 🔥 STEP 3: BULK INSERT
        let inserted: any[] = [];

        if (dto.serviceName === 'title' && documents.length) {
            inserted = await this.titleModel.insertMany(documents);
        }

        if (dto.serviceName === 'description' && documents.length) {
            inserted = await this.descriptionModel.insertMany(documents);
        }
        if (dto.serviceName === 'metaTitle' && documents.length) {
            inserted = await this.MetaTitleModel.insertMany(documents);
        }
        if (dto.serviceName === 'metaDescription' && documents.length) {
            inserted = await this.MetaDescriptionModel.insertMany(documents);
        }
        if (dto.serviceName === 'image' && documents.length) {
            inserted = await this.optimizedImage.insertMany(documents);
        }

        // 🔥 STEP 4: RESPONSE
        return {
            shopId,
            serviceName: dto.serviceName,
            deletedOld: true,
            insertedCount: inserted.length,
            products: inserted,
        };
    }


    async getOptimizedProducts(shopId: string, serviceName: string) {
        if (serviceName === 'title') {
            return this.titleModel.find({ shopId }).lean();
        }

        if (serviceName === 'description') {
            return this.descriptionModel.find({ shopId }).lean();
        }
        if (serviceName === 'metaTitle') {
            return this.MetaTitleModel.find({ shopId }).lean();
        }
        if (serviceName === 'metaDescription') {
            return this.MetaDescriptionModel.find({ shopId }).lean();
        }
        if (serviceName === 'image') {
            return this.optimizedImage.find({ shopId }).lean();
        }

        throw new Error('Invalid service name');
    }


    async applyTitleOptimization(
        shopId: string,
        dto: ApplyTitleOptimizationDto,
    ) {
        const shop = await this.shopModel.findById(shopId).lean();
        if (!shop) throw new Error('Invalid shop');

        // 1️⃣ Update Shopify
        const response = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            UPDATE_PRODUCT_TITLE_MUTATION,
            {
                input: {
                    id: dto.productId,
                    title: dto.newTitle,
                },
            },
        );

        const errors = response.productUpdate.userErrors;
        if (errors.length) throw errors;

        // 2️⃣ Store optimization reference
        const product = response.productUpdate.product;

        return this.classicTitleOptimizedModel.create({
            shopId,
            productId: dto.productId,
            oldTitle: dto.oldTitle,
            newTitle: dto.newTitle,
        });
    }

    async applyDescriptionOptimization(
        shopId: string,
        dto: ApplyDescriptionOptimizationDto,
    ) {
        const shop = await this.shopModel.findById(shopId).lean();
        if (!shop) throw new Error('Invalid shop');
        console.log(shop, dto)
        // 1️⃣ Update Shopify
        const response = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            UPDATE_PRODUCT_DESCRIPTION_MUTATION,
            {
                input: {
                    id: dto.productId,
                    descriptionHtml: dto.newDescription,
                },
            },
        );

        const errors = response.productUpdate.userErrors;
        if (errors.length) throw errors;

        // 2️⃣ Store optimization reference
        return this.classicDescriptionOptimizedModel.create({
            shopId,
            productId: dto.productId,
            oldDescription: dto.oldDescription,
            newDescription: dto.newDescription,
        });
    }


    async generateAITitle(
        shopId: string,
        dto: AITitleOptimizationDto,
    ) {
        const shop = await this.shopModel.findById(shopId).lean();
        if (!shop) throw new Error('Invalid shop');

        // 1️⃣ Fetch product
        const productResponse = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            PRODUCT_TITLE_AI_QUERY,
            { id: dto.productId },
        );

        const product = productResponse.product;
        if (!product) throw new Error('Product not found');

        // 2️⃣ Build prompt
        const prompt = buildTitleAIPrompt(product, dto);

        // 3️⃣ Call Groq AI
        let aiTitle = await this.aiService.generateTitle(prompt);

        // 4️⃣ Clean AI response
        aiTitle = aiTitle.replace(/["']/g, '').trim();

        // 5️⃣ Enforce character limits
        // if (
        //     aiTitle.length < dto.minCharacters ||
        //     aiTitle.length > dto.maxCharacters
        // ) {
        //     throw new Error('AI title does not meet character constraints');
        // }

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
            image:
                product.featuredMedia?.preview?.image?.url || null,
        };
    }



    async generateAIDescription(
        shopId: string,
        dto: AIDescriptionOptimizationDto,
    ) {
        const shop = await this.shopModel.findById(shopId).lean();
        if (!shop) throw new Error('Invalid shop');
        console.log(shop)
        // 1️⃣ Fetch product
        const productResponse = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            PRODUCT_DESCRIPTION_AI_QUERY,
            { id: dto.productId },
        );


        const product = productResponse.product;
        if (!product) throw new Error('Product not found');

        // 2️⃣ Build AI prompt
        const prompt = buildDescriptionAIPrompt(product, dto);

        // 3️⃣ Call Groq AI
        let aiDescription = await this.aiService.generateDescription(prompt);

        // 4️⃣ Clean response
        aiDescription = aiDescription.trim();

        // 5️⃣ Apply to Shopify (optional)
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


    // async fetchProductImagesForOptimization(
    //     shopDomain: string,
    //     accessToken: string,
    //     productId: string,
    // ) {
    //     const response = await this.shopifyService.shopifyRequest(
    //         shopDomain,
    //         accessToken,
    //         PRODUCT_IMAGES_WITH_VARIANTS_QUERY,
    //         { id: productId },
    //     );

    //     const product = response.product;

    //     if (!product) return null;

    //     const images = product.images.edges.map(e => e.node);
    //     const variants = product.variants.edges.map(e => e.node);

    //     const normalizedImages = images.map((image, index) => {
    //         const usedByVariants = variants.filter(
    //             v => v.image?.id === image.id,
    //         );
    //         console.log(image)
    //         if (!image.id.startsWith('gid://shopify/MediaImage/')) {
    //             throw new Error(
    //                 `Invalid image source detected. REST ProductImage ID found: ${image.id}`,
    //             );
    //         }
    //         return {
    //             imageId: image.id, // MediaImage ID
    //             imageUrl: image.originalSrc,
    //             altText: image.altText || '',
    //             imageName:
    //                 image.altText ||
    //                 image.originalSrc.split('/').pop() ||
    //                 `Image ${index + 1}`,
    //             variants: usedByVariants.map(v => ({
    //                 variantId: v.id,
    //                 title: v.title,
    //                 sku: v.sku,
    //             })),
    //         };
    //     });

    //     return {
    //         productId,
    //         productTitle: product.title,
    //         images: normalizedImages,
    //     };
    // }

//     async storeForImageOptimization(
//   shopId: string,
//   dto: StoreImageOptimizationDto,
// ) {
//   const shop = await this.shopModel.findById(shopId).lean();
//   if (!shop) throw new Error('Invalid shop');

//   await this.optimizedImage.deleteMany({ shopId });

//   const docs = [];

//   for (const productId of dto.productIds) {
//     const product = await this.shopifyService.getProduct(
//       shop.shopDomain,
//       shop.accessToken,
//       productId,
//     );

//     if (!product) continue;

//     const images = await this.shopifyService.getProductImages(
//       shop.shopDomain,
//       shop.accessToken,
//       productId,
//     );

//     const normalizedImages = images.map((img, index) => ({
//       imageRestId: String(img.id),
//       imageGraphqlId: img.admin_graphql_api_id, // 🔥 KEY
//       imageUrl: img.src,
//       imageName: img.src.split('/').pop()?.split('?')[0],
//       altText: img.alt || '',
//       variants: product.variants
//         .filter(v => v.image_id === img.id)
//         .map(v => ({
//           variantId: String(v.id),
//           title: v.title,
//           sku: v.sku,
//         })),
//     }));

//     docs.push({
//       shopId,
//       productId: String(product.id),
//       productTitle: product.title,
//       images: normalizedImages,
//     });
//   }

//   return this.imageOptimizationModel.insertMany(docs);
// }



}
