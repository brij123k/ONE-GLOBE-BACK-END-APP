import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ShopifyService } from "src/common/shopify/shopify.service";
import { AiService } from "src/config/ai.service";
import { AnalyzeTagsDto } from "src/dto/tags-builder/analyze-tags.dto";
import { AddTagsDto } from "src/dto/tags-builder/add-tags.dto";
import { RemoveTagsDto } from "src/dto/tags-builder/remove-tags.dto";
import { PRODUCTS_COLLECTION_BUILDER_QUERY } from "src/graphql/collectionBuilder/products-collection-builder.query";
import { PRODUCT_BY_ID_QUERY } from "src/graphql/product-by-id.query";
import { Shop } from "src/schema/shop.schema";
import { UPDATE_PRODUCT_TAGS_MUTATION } from "src/graphql/tagsBuilder/updateProductTags.mutation";
import { TagsProduct } from "src/schema/tags-builder/tag_builder.schema";

@Injectable()
export class TagsBuilderService {

constructor(
    private shopifyService: ShopifyService,
    private aiService: AiService,

    @InjectModel(TagsProduct.name)
    private tagsModel: Model<TagsProduct>,

    @InjectModel(Shop.name)
    private shopModel: Model<Shop>,
){}

//////////////////////////////////////////////////////////
// GET SHOP
//////////////////////////////////////////////////////////

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
// GET PRODUCT TAGS
//////////////////////////////////////////////////////////

async getProductTags(shopId: string, productIds: string[]) {

    const shop = await this.getShop(shopId);

    const result = {};

    for (const id of productIds) {

        const data = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            PRODUCT_BY_ID_QUERY,
            { id }
        );

        result[id] = data.product.tags;

    }

    return result;

}

//////////////////////////////////////////////////////////
// AI TAG ANALYSIS
//////////////////////////////////////////////////////////

async analyzeProductTags(shopId: string, dto: AnalyzeTagsDto) {

    const shop = await this.getShop(shopId);

    const product = await this.shopifyService.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        PRODUCT_BY_ID_QUERY,
        { id: dto.productId }
    );

    const prompt = `
Generate useful ecommerce tags for the following product.

Title: ${product.product.title}

Description: ${product.product.description}

Vendor: ${product.product.vendor}

Product Type: ${product.product.productType}

Return ONLY valid JSON.

Example:
{
  "tags": ["tag1","tag2","tag3"]
}
`;

    const ai = await this.aiService.generateCategory(prompt);

    // Extract JSON block
    const jsonMatch = ai.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
        throw new Error("AI returned invalid JSON format");
    }

    let jsonString = jsonMatch[0];

    // Fix unquoted keys
    jsonString = jsonString.replace(/(\w+):/g, '"$1":');

    // Fix unquoted tag values
    jsonString = jsonString.replace(/:\s*\[([^\]]+)\]/, (match, tags) => {
        const cleanedTags = tags
            .split(',')
            .map(tag => `"${tag.trim().replace(/"/g, '')}"`)
            .join(',');
        return `:[${cleanedTags}]`;
    });

    return JSON.parse(jsonString);
}

//////////////////////////////////////////////////////////
// ADD TAGS
//////////////////////////////////////////////////////////

async addTags(shopId: string, dto: AddTagsDto) {

    const shop = await this.getShop(shopId);

    let updatedCount = 0;

    for (const productId of dto.productIds) {

        const data = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            PRODUCT_BY_ID_QUERY,
            { id: productId }
        );

        const existingTags = data.product.tags || [];

        const newTags = [...new Set([...existingTags, ...dto.tags])];

        await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            UPDATE_PRODUCT_TAGS_MUTATION,
            {
                input:{
                    id: productId,
                    tags: newTags
                }
            }
        );

        await this.tagsModel.updateOne(
            { shopId, productId },
            { tags: newTags },
            { upsert: true }
        );

        updatedCount++;

    }

    return {
        success:true,
        updatedCount
    };
}

//////////////////////////////////////////////////////////
// REMOVE TAGS
//////////////////////////////////////////////////////////

async removeTags(shopId: string, dto: RemoveTagsDto) {

    const shop = await this.getShop(shopId);

    for (const productId of dto.productIds) {

        const data = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            PRODUCT_BY_ID_QUERY,
            { id: productId }
        );

        const existingTags = data.product.tags || [];

        const updatedTags = existingTags.filter(
            tag => !dto.tags.includes(tag)
        );

        await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            UPDATE_PRODUCT_TAGS_MUTATION,
            {
                input:{
                    id: productId,
                    tags: updatedTags
                }
            }
        );

        await this.tagsModel.updateOne(
            { shopId, productId },
            { tags: updatedTags },
            { upsert: true }
        );

    }

    return {
        success:true
    };

}

}