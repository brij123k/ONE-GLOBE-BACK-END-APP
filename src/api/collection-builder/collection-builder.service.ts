import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { buildProductCategoryPrompt } from "src/common/buildProductCategoryPrompt";
import { ShopifyService } from "src/common/shopify/shopify.service";
import { AiService } from "src/config/ai.service";
import { AddProductsToCollectionDto } from "src/dto/collection-builder/add-products-to-collection.dto";
import { AnalyzeProductCategoryDto } from "src/dto/collection-builder/analyze-product-category.dto";
import { CreateCollectionDto } from "src/dto/collection-builder/create-collection.dto";
import { ADD_PRODUCTS_TO_COLLECTION_MUTATION } from "src/graphql/collectionBuilder/add-product-collection.query";
import { DELETE_COLLECTION_MUTATION } from "src/graphql/collectionBuilder/collectionDelete";
import { CREATE_COLLECTION_MUTATION } from "src/graphql/collectionBuilder/create-collection.query";
import { PRODUCT_COLLECTIONS_QUERY } from "src/graphql/collectionBuilder/product-collections.query";
import { PRODUCTS_COLLECTION_BUILDER_QUERY } from "src/graphql/collectionBuilder/products-collection-builder.query";
import { COLLECTIONS_QUERY } from "src/graphql/collections.query";
import { PRODUCT_BY_ID_QUERY } from "src/graphql/product-by-id.query";
import { CollectionProduct } from "src/schema/collection_builder/collection_builder.schema";
import { ProductSnapshot } from "src/schema/collection_builder/product-snapshot.schema";
import { Shop } from "src/schema/shop.schema";

@Injectable()
export class CollectionBuilderService {

    constructor(
        private shopifyService: ShopifyService,
        private aiService: AiService,

        @InjectModel(ProductSnapshot.name)
        private snapshotModel: Model<ProductSnapshot>,

        @InjectModel(CollectionProduct.name)
        private collectionProductModel: Model<CollectionProduct>,

        @InjectModel(Shop.name)
        private shopModel: Model<Shop>,
    ) { }

    private async getShop(shopId: string) {
        const shop = await this.shopModel.findById(shopId).lean();
        if (!shop) throw new Error("Invalid shop");
        return shop;
    }

    //////////////////////////////////////////////////////////
    // GET PRODUCTS
    //////////////////////////////////////////////////////////

    async getProducts(shopId: string) {

        const shop = await this.getShop(shopId);

        const data = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            PRODUCTS_COLLECTION_BUILDER_QUERY,
            { first: 100 }
        );

        return data.products.edges.map(e => e.node);
    }

    //////////////////////////////////////////////////////////
    // GET COLLECTIONS
    //////////////////////////////////////////////////////////

    async getCollections(shopId: string) {

        const shop = await this.getShop(shopId);

        const data = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            COLLECTIONS_QUERY,
            { first: 100 }
        );

        return data.collections.edges.map(e => e.node);
    }

    //////////////////////////////////////////////////////////
    // PRODUCT → COLLECTION MAP
    //////////////////////////////////////////////////////////

    async getProductCollections(shopId: string, productIds: string[]) {

        const shop = await this.getShop(shopId);

        const result = {};

        for (const id of productIds) {

            const data = await this.shopifyService.shopifyRequest(
                shop.shopDomain,
                shop.accessToken,
                PRODUCT_COLLECTIONS_QUERY,
                { id }
            );

            result[id] =
                data.product.collections.edges.map(e => e.node.title);

        }

        return result;

    }

    //////////////////////////////////////////////////////////
    // AI CATEGORY ANALYSIS
    //////////////////////////////////////////////////////////

    async analyzeProductCategory(shopId: string, dto: AnalyzeProductCategoryDto) {

        const shop = await this.getShop(shopId);

        const product = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            PRODUCT_BY_ID_QUERY,
            { id: dto.productId }
        );

        const prompt = buildProductCategoryPrompt(product.product);
        console.log(prompt)
        const ai = await this.aiService.generateCategory(prompt);
        console.log(ai, "1")
        const cleaned = ai
            .replace(/(\w+):/g, '"$1":')
            .replace(/: ([^",{}\n]+)/g, ': "$1"')
            .replace(/"(\d+\.\d+)"/, '$1');


        return JSON.parse(cleaned);

    }

    //////////////////////////////////////////////////////////
    // CREATE COLLECTION
    //////////////////////////////////////////////////////////

    async createCollection(shopId: string, dto: CreateCollectionDto) {

        const shop = await this.getShop(shopId);

        const response = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            CREATE_COLLECTION_MUTATION,
            {
                input: {
                    title: dto.title
                }
            }
        );

        return {
            success: true,
            collectionId: response.collectionCreate.collection.id,
            handle: response.collectionCreate.collection.handle
        };

    }

    //////////////////////////////////////////////////////////
    // ADD PRODUCTS
    //////////////////////////////////////////////////////////

    async addProductsToCollection(shopId: string, dto: AddProductsToCollectionDto) {

        const shop = await this.getShop(shopId);

        // Find products that already belong to this collection
        const existingProducts = await this.collectionProductModel.find({
            shopId,
            productId: { $in: dto.productIds },
            "collections.id": dto.collectionId
        }).select("productId");

        const existingProductIds = existingProducts.map(p => p.productId);

        // Filter products that are NOT already in the collection
        const productIdsToAdd = dto.productIds.filter(
            id => !existingProductIds.includes(id)
        );

        if (!productIdsToAdd.length) {
            return {
                success: true,
                updatedCount: 0,
                message: "All products already belong to this collection"
            };
        }

        // Shopify API call
        const res = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            ADD_PRODUCTS_TO_COLLECTION_MUTATION,
            {
                id: dto.collectionId,
                productIds: productIdsToAdd
            }
        );

        // Update MongoDB
        await this.collectionProductModel.updateMany(
            {
                shopId,
                productId: { $in: productIdsToAdd }
            },
            {
                $addToSet: {
                    collections: {
                        id: dto.collectionId,
                        title: dto.collectionTitle,
                        handle: dto.collectionHandle
                    }
                }
            }
        );

        return {
            success: true,
            updatedCount: productIdsToAdd.length
        };
    }

   async deleteCollection(shopId: string, collectionId: string) {

  const shop = await this.getShop(shopId);

  const res = await this.shopifyService.shopifyRequest(
    shop.shopDomain,
    shop.accessToken,
    DELETE_COLLECTION_MUTATION,
    {
      input: {
        id: collectionId
      }
    }
  );

  if (res.collectionDelete.userErrors.length) {
    throw new Error(res.collectionDelete.userErrors[0].message);
  }
  return {
    success: true,
    deletedCollectionId: res.collectionDelete.deletedCollectionId
  };
}

}