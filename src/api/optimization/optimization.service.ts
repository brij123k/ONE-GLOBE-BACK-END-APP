import axios from 'axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Collection, Model } from 'mongoose';

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
import { COLLECTION_PRODUCTS_QUERY } from 'src/graphql/collection-products.query';
import { buildProductSearchQuery } from 'src/utils/product-query.builder';
import { PRODUCTS_QUERY } from 'src/graphql/products.query';
import { SkuOptimization } from 'src/schema/sku/skuOptimization.schema';
import { ImageAltOptimization } from 'src/schema/image/image-alt-optimization.schema';
import { ImageNameOptimization } from 'src/schema/image/image-name-optimization.schema';
import { ProductType } from 'src/schema/product-type/product-type.schema';
import { Vendor } from 'src/schema/vendor/vendor.schema';
import { CollectionProduct } from 'src/schema/collection_builder/collection_builder.schema';
import { TagsProduct } from 'src/schema/tags-builder/tag_builder.schema';
import { Specification } from 'src/schema/metafileds/specification.schema';
import { GET_PRODUCT_SPECIFICATIONS_QUERY } from 'src/graphql/metafields/get-product-specifications.query';
import { MetafieldsOptimization } from 'src/schema/metafileds/metafields-optimization.schema';
import { GET_PRODUCT_OPTIMIZATION_METAFIELDS_QUERY } from 'src/graphql/metafields/get-product-optimization-metafields.query';
import { GET_PRODUCT_BASE_DATA_QUERY } from 'src/graphql/metafields/get-product-base-data.query';
import { buildRelatedProductsQuery } from 'src/utils/build-related-products-query';
import { SEARCH_RELATED_PRODUCTS_QUERY } from 'src/graphql/metafields/search-releted-product-query';
import { DetailOptimization } from 'src/schema/detail/detail-optimization.schema';
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

        @InjectModel(SkuOptimization.name)
        private skuModel: Model<SkuOptimization>,

        @InjectModel(ImageAltOptimization.name)
        private imageAltModel: Model<ImageAltOptimization>,

        @InjectModel(ImageNameOptimization.name)
        private imageNameModel: Model<ImageNameOptimization>,

        @InjectModel(ProductType.name)
        private productType: Model<ProductType>,

        @InjectModel(Vendor.name)
        private vendorModel: Model<Vendor>,

        @InjectModel(CollectionProduct.name)
        private collectionProductModel: Model<CollectionProduct>,

        @InjectModel(TagsProduct.name)
        private tagsProductModel: Model<TagsProduct>,

        @InjectModel(Specification.name)
        private specificationModel: Model<Specification>,

        @InjectModel(MetafieldsOptimization.name)
        private metafieldsModel: Model<MetafieldsOptimization>,

        @InjectModel(DetailOptimization.name)
        private detailModel: Model<DetailOptimization>,

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
            sku: this.skuModel,
            imageALT: this.imageAltModel,
            imageName: this.imageNameModel,
            detail: this.detailModel,
            productType: this.productType,
            vendor: this.vendorModel,
            collection: this.collectionProductModel,
            tag: this.tagsProductModel,
            specification: this.specificationModel,
            metafields: this.metafieldsModel
        };

        return map[serviceName];
    }

    private async getShop(shopId: string) {
        const shop = await this.shopModel.findById(shopId).lean();
        if (!shop) throw new Error('Invalid shop');
        return shop;
    }

    private buildDetailDocument(shopId: string, product: any) {
        const productImage =
            product?.featuredMedia?.preview?.image?.url || null;
        const images =
            product.media?.edges
                ?.filter((img) => img.node.mediaContentType === 'IMAGE')
                ?.map((img) => {
                    const imageNode = img.node;
                    const imageUrl = imageNode.image?.url || null;
                    const imageName = imageUrl
                        ? imageUrl.split('/').pop()?.split('?')[0]
                        : null;

                    return {
                        imageId: imageNode.id,
                        imageUrl,
                        imageName,
                        altText: imageNode.alt || '',
                    };
                }) || [];

        return {
            shopId,
            productId: product.id,
            productImage,
            title: product.title,
            description: product.description || '',
            descriptionHtml: product.descriptionHtml || '',
            metaTitle: product.seo?.title || product.title || '',
            metaDescription: product.seo?.description || '',
            handle: product.handle || '',
            images,
            optimized: false,
        };
    }

    private pushDocumentByService(
        documents: any[],
        serviceName: string,
        shopId: string,
        product: any,
    ) {
        const image =
            product?.featuredMedia?.preview?.image?.url || null;
        const collections =
            product.collections?.edges?.map(e => ({
                id: e.node.id,
                title: e.node.title,
                handle: e.node.handle
            })) || [];
        switch (serviceName) {
            case 'title':
                documents.push({
                    shopId,
                    productId: product.id,
                    productImage: image,
                    title: product.title,
                });
                break;

            case 'description':
                documents.push({
                    shopId,
                    productId: product.id,
                    productImage: image,
                    description: product.descriptionHtml || '',
                    descriptionHtml: product.descriptionHtml || '',
                });
                break;

            case 'metaTitle':
                documents.push({
                    shopId,
                    productId: product.id,
                    productImage: image,
                    title: product.title,
                    metaTitle: product.seo?.title || product.title,
                });
                break;

            case 'metaDescription':
                documents.push({
                    shopId,
                    productId: product.id,
                    productImage: image,
                    description: product.description || '',
                    metaDescription: product.seo?.description || '',
                });
                break;

            case 'handle':
                documents.push({
                    shopId,
                    productId: product.id,
                    productImage: image,
                    title: product.title,
                    metaHandle: product.handle || '',
                });
                break;

            case 'pricing':
                const variants =
                    product.variants?.edges?.map((v) => ({
                        variantId: v.node.id,
                        title: v.node.title,
                        sku: v.node.sku,
                        image: v.node.image?.url || null,
                        price: Number(v.node.price || 0),
                        compareAtPrice: Number(v.node.compareAtPrice || 0),
                        costPrice: Number(
                            v.node.inventoryItem?.unitCost?.amount || 0,
                        ),
                        inventoryQuantity: v.node.inventoryQuantity || 0,
                    })) || [];

                documents.push({
                    shopId,
                    productId: product.id,
                    title: product.title,
                    productImage: image,
                    variants,
                });
                break;
            case 'sku':
                const skuVariants =
                    product.variants?.edges?.map((v) => ({
                        shopId,
                        productId: product.id,
                        inventoryItemId: v.node.inventoryItem.id,
                        title: product.title,
                        handle: product.handle,
                        vender: product.vendor,
                        productType: product.productType || 'No Product Type Found',
                        productImage: image,
                        variantId: v.node.id,
                        sku: v.node.sku || 'No SKU Found',
                    })) || [];

                documents.push(...skuVariants);
                break;
            case 'imageALT':

                const images =
                    product.media?.edges
                        ?.filter((img) => img.node.mediaContentType === 'IMAGE')
                        ?.map((img) => {

                            const imageNode = img.node;
                            const variant = product.variants?.edges?.[0]?.node;

                            const imageUrl = imageNode.image?.url || null;
                            const imageName = imageUrl ? imageUrl.split('/').pop() : null;

                            return {
                                shopId,
                                productId: product.id,
                                productTitle: product.title,

                                variantId: variant?.id || null,
                                variantTitle: variant?.title || null,

                                inventoryItemId: variant?.inventoryItem?.id || null,

                                imageId: imageNode.id,

                                imageName,
                                imageUrl,
                                altText: imageNode.alt || '',
                            };

                        }) || [];

                documents.push(...images);

                break;


            case 'imageName':

                const imageNames =
                    product.media?.edges
                        ?.filter((img) => img.node.mediaContentType === 'IMAGE')
                        ?.map((img) => {

                            const imageNode = img.node;

                            const imageUrl = imageNode.image?.url || null;
                            const imageName = imageUrl ? imageUrl.split('/').pop() : null;

                            return {
                                shopId,
                                productId: product.id,
                                productTitle: product.title,

                                imageId: imageNode.id,
                                imageUrl,
                                imageName,
                            };

                        }) || [];

                documents.push(...imageNames);

                break;

            case 'detail':
                documents.push(this.buildDetailDocument(shopId, product));
                break;

            case 'productType':
                documents.push({
                    shopId,
                    productId: product.id,
                    productImage: image,
                    title: product.title,
                    productType: product.productType || 'Product Type Not Found',
                });
                break;

            case 'vendor':
                documents.push({
                    shopId,
                    productId: product.id,
                    productImage: image,
                    title: product.title,
                    vendor: product.Vendor || 'Vendor Not Found',
                });
                break;
            case 'collection':

                documents.push({
                    shopId,
                    productId: product.id,
                    title: product.title,
                    vendor: product.vendor,
                    productType: product.productType,
                    tags: product.tags || [],
                    productImage: image,
                    collections: collections || []
                });

                break;
            case 'tag':
                documents.push({
                    shopId,
                    productId: product.id,
                    title: product.title,
                    vendor: product.vendor,
                    productType: product.productType,
                    tags: product.tags || [],
                    productImage: image,
                });

                break;
            case "specification":
                console.log(product)
                documents.push({
                    shopId,
                    productId: product.id,
                    title: product.title,
                    productImage: image,
                    specifications: product.metafields?.edges?.reduce((acc, e) => {
                        acc[e.node.key] = e.node.value;
                        return acc;
                    }, {}) || {}
                });
                break;
            case "metafields":
                const metafields = this.getProductOptimizationMetafields(
                    shopId,
                    product.id
                );
                documents.push({
                    shopId,
                    productId: product.id,
                    title: product.title,
                    productType: product.productType,
                    vendor: product.vendor,
                    productImage: image,
                    optimized: false,
                    metafields
                });
                this.generateRelatedProducts(shopId, product.id)

                break;
        }
    }
    private async shopifyRequest(
        shopDomain: string,
        accessToken: string,
        query: string,
        variables: any,
    ) {
        const url = `https://${shopDomain}/admin/api/2026-01/graphql.json`;

        const { data } = await axios.post(
            url,
            { query, variables },
            {
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json',
                },
            },
        );

        if (data.errors) throw data.errors;
        return data.data;
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

    private async getProductForOptimizationStorage(
        shop: any,
        product: any,
        serviceName: string,
    ) {
        if (serviceName !== 'sku') {
            return product;
        }

        // SKU storage needs the full variant list, while the list queries only
        // load the first variant for most optimization types.
        return this.fetchProduct(shop.shopDomain, shop.accessToken, product.id);
    }

    async storeProducts(shopId: string, dto: StoreOptimizationDto) {
        if (dto.filters) {
            return this.storeAllproduct(shopId, dto)
        }
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
            const collections =
                product.collections?.edges?.map(e => ({
                    id: e.node.id,
                    title: e.node.title,
                    handle: e.node.handle
                })) || [];
            switch (dto.serviceName) {
                case 'title':
                    documents.push({ shopId, productId, productImage: image, title: product.title });
                    break;

                case 'description':
                    documents.push({
                        shopId,
                        productId,
                        productImage: image,
                        title:product.title,
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
                        description: product.description || 'No Description',
                        metaDescription: product.seo?.description || 'No Description',
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

                case 'sku':
                    const skuVariants =
                        product.variants?.edges?.map((v) => ({
                            shopId,
                            productId,
                            inventoryItemId: v.node.inventoryItem.id,
                            title: product.title,
                            handle: product.handle,
                            vender: product.vendor,
                            productType: product.productType || 'No Product Type Found',
                            productImage: image,
                            variantId: v.node.id,
                            sku: v.node.sku || 'No SKU Found',
                        })) || [];

                    documents.push(...skuVariants);
                    break;

                case 'imageALT':

                    const altImages =
                        product.media?.edges
                            ?.filter(img => img.node.mediaContentType === 'IMAGE')
                            ?.map(img => {

                                const node = img.node;
                                const variant = product.variants?.edges?.[0]?.node;

                                const imageUrl = node.image?.url || null;
                                const imageName = imageUrl ? imageUrl.split('/').pop() : null;

                                return {
                                    shopId,
                                    productId,
                                    productTitle: product.title,

                                    variantId: variant?.id || null,
                                    variantTitle: variant?.title || null,

                                    inventoryItemId: variant?.inventoryItem?.id || null,

                                    imageId: node.id,

                                    imageName,
                                    imageUrl,
                                    altText: node.alt || '',
                                };
                            }) || [];

                    documents.push(...altImages);

                    break;

                case 'imageName':

                    const imageNames =
                        product.media?.edges
                            ?.filter(img => img.node.mediaContentType === 'IMAGE')
                            ?.map(img => {

                                const node = img.node;

                                const imageUrl = node.image?.url || null;
                                const imageName = imageUrl ? imageUrl.split('/').pop() : null;

                                return {
                                    shopId,
                                    productId,
                                    productTitle: product.title,

                                    imageId: node.id,
                                    imageUrl,
                                    imageName,
                                };

                            }) || [];

                    documents.push(...imageNames);

                    break;

                case 'detail':
                    documents.push(this.buildDetailDocument(shopId, product));
                    break;

                case 'productType':
                    documents.push({
                        shopId,
                        productId,
                        productImage: image,
                        title: product.title,
                        productType: product.productType || 'Product Type Not Found',
                    });
                    break;
                case 'vendor':
                    documents.push({
                        shopId,
                        productId,
                        productImage: image,
                        title: product.title,
                        vendor: product.vendor || 'Vendor Not Found',
                    });
                    break;

                case 'collection':

                    documents.push({
                        shopId,
                        productId,
                        title: product.title,
                        vendor: product.vendor,
                        productType: product.productType,
                        tags: product.tags || [],
                        productImage: image,
                        collections: collections
                    });

                    break;

                case 'tag':
                    documents.push({
                        shopId,
                        productId,
                        title: product.title,
                        vendor: product.vendor,
                        productType: product.productType,
                        tags: product.tags || [],
                        productImage: image,
                    });

                    break;
                case "specification":

                    const rawValue = product.metafield?.value || "{}";
                    let specData = {};

                    try {
                        specData = JSON.parse(rawValue);
                    } catch (err) {
                        console.error("Invalid metafield JSON", err);
                    }

                    documents.push({
                        shopId,
                        productId,
                        title: product.title,
                        productImage: image,
                        specifications: specData
                    });

                    break;

                case 'metafields':
                    const metafields = await this.getProductOptimizationMetafields(
                        shopId,
                        product.id
                    );
                    console.log(metafields)
                    documents.push({
                        shopId,
                        productId,
                        title: product.title,
                        productType: product.productType,
                        vendor: product.vendor,
                        productImage: image,
                        optimized: false,
                        metafields
                    });
                    this.generateRelatedProducts(shopId, productId)

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

    async storeAllproduct(shopId: string, dto: StoreOptimizationDto) {
        const shop = await this.getShop(shopId);

        const model = this.getModel(dto.serviceName);
        if (!model) throw new Error('Invalid service name');

        await model.deleteMany({ shopId });

        const documents: any[] = [];
        const limit = 100;

        let hasNextPage = true;
        let after: string | null = null;

        const filters = dto.filters || {};

        // ---------- COLLECTION IDS ----------
        let collectionIds: string[] = [];

        if (filters.collections) {
            collectionIds = Array.isArray(filters.collections)
                ? filters.collections
                : [filters.collections];
        }

        while (hasNextPage) {
            let data;

            // ===============================================
            // COLLECTION MODE
            // ===============================================
            if (collectionIds.length > 0) {
                const variables: any = {
                    collectionId: collectionIds[0],
                    first: limit,
                    after,
                };

                data = await this.shopifyRequest(
                    shop.shopDomain,
                    shop.accessToken,
                    COLLECTION_PRODUCTS_QUERY,
                    variables,
                );

                const edges = data.collection.products.edges;
                hasNextPage = data.collection.products.pageInfo.hasNextPage;
                after = data.collection.products.pageInfo.endCursor;

                for (const edge of edges) {
                    const product = await this.getProductForOptimizationStorage(
                        shop,
                        edge.node,
                        dto.serviceName,
                    );
                    this.pushDocumentByService(documents, dto.serviceName, shopId, product);
                }
            }

            else {
                const { query } = buildProductSearchQuery(filters);

                const variables: any = {
                    query,
                    first: limit,
                    after,
                };

                data = await this.shopifyRequest(
                    shop.shopDomain,
                    shop.accessToken,
                    PRODUCTS_QUERY,
                    variables,
                );

                const edges = data.products.edges;
                hasNextPage = data.products.pageInfo.hasNextPage;
                after = data.products.pageInfo.endCursor;

                for (const edge of edges) {
                    const product = await this.getProductForOptimizationStorage(
                        shop,
                        edge.node,
                        dto.serviceName,
                    );
                    this.pushDocumentByService(documents, dto.serviceName, shopId, product);
                }
            }
        }

        const inserted = documents.length
            ? await model.insertMany(documents)
            : [];

        return {
            shopId,
            serviceName: dto.serviceName,
            deletedOld: true,
            insertedCount: inserted.length,
            products: inserted,
        };
    }


    async getOptimizedProducts(shopId: string, serviceName: string) {
        const model = this.getModel(serviceName);
        console.log(model)
        if (!model) throw new Error('Invalid service name');
        return model.find({ shopId }).lean();
    }


    async getSpecificationsFromShopify(shopId: string, productId: string) {

        const shop = await this.getShop(shopId);

        const data = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            GET_PRODUCT_SPECIFICATIONS_QUERY,
            { id: productId }
        );

        const specs = {};

        data.product.metafields.edges.forEach(e => {
            specs[e.node.key] = e.node.value;
        });

        return specs;
    }

    async getProductOptimizationMetafields(
        shopId: string,
        productId: string,
    ) {
        console.log(shopId, productId)

        const shop = await this.getShop(shopId);

        const data = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            GET_PRODUCT_OPTIMIZATION_METAFIELDS_QUERY,
            { id: productId }
        );
        console.log(data)

        const product = data.product;

        let boostKeywords = [];

        if (product.search_boost_keywords?.value) {
            try {
                boostKeywords = JSON.parse(product.search_boost_keywords.value);
            } catch {
                boostKeywords = [];
            }
        }

        const complementaryProducts =
            product.complementary_products?.references?.edges?.map(e => ({
                id: e.node.id,
                title: e.node.title,
                image: e.node.featuredMedia?.preview?.image?.url || null
            })) || [];

        const relatedProducts =
            product.related_products?.references?.edges?.map(e => ({
                id: e.node.id,
                title: e.node.title,
                image: e.node.featuredMedia?.preview?.image?.url || null
            })) || [];

        return {
            search_boost_keywords: {
                short: boostKeywords,
                long: [],
                synonyms: []
            },
            complementary_products: complementaryProducts,
            related_products: relatedProducts
        };
    }

    async generateRelatedProducts(shopId: string, productId: string) {

        const shop = await this.getShop(shopId);

        // 1️⃣ Get base product data
        const baseData = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            GET_PRODUCT_BASE_DATA_QUERY,
            { id: productId }
        );

        const product = baseData.product;
        if (!product) throw new Error("Product not found");

        // 2️⃣ Build search query
        const searchQuery = buildRelatedProductsQuery(product);

        // 3️⃣ Fetch related products
        const relatedData = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            SEARCH_RELATED_PRODUCTS_QUERY,
            {
                query: searchQuery,
                first: 10
            }
        );

        const relatedProducts = relatedData.products.edges
            .map(e => {
                const p = e.node;

                return {
                    id: p.id,
                    title: p.title,
                    image: p.featuredMedia?.preview?.image?.url || null
                };
            })
            .filter(p => p.id !== productId);

        // 4️⃣ Save to DB
        const record = await this.metafieldsModel.findOneAndUpdate(
            { shopId, productId },
            {
                $set: {
                    related_products: relatedProducts
                }
            },
            { new: true, upsert: true }
        );

        return {
            productId,
            related_products: relatedProducts,
            count: relatedProducts.length
        };
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

        const res = await this.classicTitleOptimizedModel.create({
            shopId,
            productId: dto.productId,
            oldTitle: dto.oldTitle,
            newTitle: dto.newTitle,
        });
        await this.titleModel.findOneAndUpdate({productId:dto.productId},{title:dto.newTitle})
        return res
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

        const res = await this.classicDescriptionOptimizedModel.create({
            shopId,
            productId: dto.productId,
            oldDescription: dto.oldDescription,
            newDescription: dto.newDescription,
        });
        await this.descriptionModel.findOneAndUpdate({productId:dto.productId},{description:dto.newDescription, descriptionHtml:dto.newDescription})
        return res
    }

    // =====================================================
    // 🤖 AI TITLE
    // =====================================================
    async generateAITitle(shopId: string, dto: AITitleOptimizationDto) {
        console.log(dto,"1")
        const shop = await this.getShop(shopId);
        const productResponse = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            PRODUCT_TITLE_AI_QUERY,
            { id: dto.productId },
        );

        const product = productResponse.product;
        if (!product) throw new Error('Product not found');

        const imageUrl = product.featuredMedia?.preview?.image?.url || null;
        const useImage = dto.image ?? true;
        const useTitle = dto.title ?? true;
        const useexamples=dto.exampleButton ?? true;
        console.log(useexamples,"2")
        if (!useImage && !useTitle) {
            throw new BadRequestException('At least one source must be enabled: image or title');
        }

        if (useImage && !imageUrl && !useTitle) {
            throw new BadRequestException('Product image not found. Enable title or add a featured image.');
        }

        const prompt = buildTitleAIPrompt(product, {
            ...dto,
            image: useImage && Boolean(imageUrl),
            title: useTitle,
            example:useexamples,
            examples:dto.examples,
        });
        console.log(prompt)
        let aiTitle = useImage && imageUrl
            ? await this.aiService.generateTitleFromImage(prompt, imageUrl)
            : await this.aiService.generateTitle(prompt);
        console.log(aiTitle)
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
                image: imageUrl,
                imageAnalyzed: useImage && Boolean(imageUrl),
                titleAnalyzed: useTitle,
                optimizationRecordId: applied._id,
            };
        }

        return {
            productId: dto.productId,
            oldTitle: product.title,
            newTitle: aiTitle,
            characterCount: aiTitle.length,
            image: imageUrl,
            imageAnalyzed: useImage && Boolean(imageUrl),
            titleAnalyzed: useTitle,
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

        const imageUrl = product.featuredMedia?.preview?.image?.url || null;
        const useImage = dto.image ?? true;
        const useDescription = dto.description ?? true;

        if (!useImage && !useDescription) {
            throw new BadRequestException('At least one source must be enabled: image or description');
        }

        if (useImage && !imageUrl && !useDescription) {
            throw new BadRequestException('Product image not found. Enable description or add a featured image.');
        }

        const prompt = buildDescriptionAIPrompt(product, {
            ...dto,
            image: useImage && Boolean(imageUrl),
            description: useDescription,
        });
        let aiDescription = useImage && imageUrl
            ? await this.aiService.generateDescriptionFromImage(prompt, imageUrl)
            : await this.aiService.generateDescription(prompt);
        aiDescription = aiDescription.trim();

        if (dto.apply === true) {
            const applied = await this.applyDescriptionOptimization(shopId, {
                productId: dto.productId,
                oldDescription: product.descriptionHtml,
                newDescription: aiDescription,
            });

            return {
                applied: true,
                productId: dto.productId,
                oldDescription: product.descriptionHtml,
                newDescription: aiDescription,
                characterCount: aiDescription.length,
                image: imageUrl,
                imageAnalyzed: useImage && Boolean(imageUrl),
                descriptionAnalyzed: useDescription,
                optimizationRecordId: applied._id,
            };
        }

        return {
            productId: dto.productId,
            oldDescription: product.descriptionHtml,
            newDescription: aiDescription,
            characterCount: aiDescription.length,
            image: imageUrl,
            imageAnalyzed: useImage && Boolean(imageUrl),
            descriptionAnalyzed: useDescription,
        };
    }
}
