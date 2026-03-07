import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import { ShopifyService } from 'src/common/shopify/shopify.service';
import { PRODUCTIDS_QUERY } from 'src/graphql/productIds.query';
import { UPDATE_PRODUCT_DESCRIPTION_MUTATION } from 'src/graphql/update-product-description';
import { UPDATE_PRODUCT_Handle_MUTATION } from 'src/graphql/update-product-handle';
import { UPDATE_PRODUCT_META_MUTATION } from 'src/graphql/update-product-meta-title';
import { UPDATE_PRODUCT_TITLE_MUTATION } from 'src/graphql/update-product-title';
import { ClassicDescriptionOptimized } from 'src/schema/descriptions/classic-description-optimized.schema';
import { MetaDescription } from 'src/schema/meta-description/classic-meta-description.schema';
import { MetaHandle } from 'src/schema/meta-handle/classic-meta-handle.schema';
import { MetaTitle } from 'src/schema/meta-title/classic-meta-title.schema';
import { Shop } from 'src/schema/shop.schema';
import { ClassicTitleOptimized } from 'src/schema/title/classic-title-optimized.schema';
import { buildProductSearchQuery } from 'src/utils/product-query.builder';
@Injectable()
export class ReviertService {
  constructor(
    private readonly shopifyService: ShopifyService,
    @InjectModel(Shop.name) private shopModel: Model<Shop>,

    @InjectModel(ClassicTitleOptimized.name)
    private titleModel: Model<ClassicTitleOptimized>,

    @InjectModel(ClassicDescriptionOptimized.name)
    private descriptionModel: Model<ClassicDescriptionOptimized>,

    @InjectModel(MetaTitle.name)
    private metaTitleModel: Model<MetaTitle>,

    @InjectModel(MetaDescription.name)
    private metaDescriptionModel: Model<MetaDescription>,

    @InjectModel(MetaHandle.name)
    private metaHandleModel: Model<MetaHandle>,
  ) { }

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

  /* ---------------------------------------------------- */
  /* REUSABLE: GET PRODUCT IDS                            */
  /* ---------------------------------------------------- */

  private async getProductIds(
    shop: any,
    filters?: any,
    productIds?: string[],
  ): Promise<string[]> {
    if (productIds?.length) return productIds;

    if (!filters) return [];

    const { query } = buildProductSearchQuery(filters);

    const data = await this.shopifyRequest(
      shop.shopDomain,
      shop.accessToken,
      PRODUCTIDS_QUERY,
      {
        query,
        first: 250,
      },
    );

    return (data.products.edges || []).map((edge: any) => edge.node.id);
  }

  /* ---------------------------------------------------- */
  /* REUSABLE: GET REVERT DATA                            */
  /* ---------------------------------------------------- */

  private async getRevertData(
    model: Model<any>,
    shopId: string,
    productIds: string[],
  ) {
    if (!productIds.length) return [];

    return model.find({
      shopId,
      productId: { $in: productIds },
    });
  }

  /* ---------------------------------------------------- */
  /* REUSABLE: REVERT PRODUCTS                            */
  /* ---------------------------------------------------- */

  private async revertProducts(
    model: Model<any>,
    shop: any,
    shopId: string,
    productIds: string[],
    mutation: string,
    valueKey: string,
  ) {
    if (!productIds.length) {
      return { success: true, reverted: 0 };
    }

    const revertRecords = await this.getRevertData(
      model,
      shopId,
      productIds,
    );

    if (!revertRecords.length) {
      return { success: true, reverted: 0 };
    }

    let revertedCount = 0;

    for (const record of revertRecords) {
      let input: any = { id: record.productId };

      if (valueKey === 'seo.title') {
        input.seo = {
          title: record.oldMetaTitle,
        };
      } else if (valueKey === 'seo.description') {
        input.seo = {
          description: record.oldMetaDescription,
        };
      } else {
        input[valueKey] =
          record[`old${valueKey.charAt(0).toUpperCase() + valueKey.slice(1)}`];
      }

      await this.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        mutation,
        { input },
      );

      await model.deleteOne({ productId: record.productId });

      revertedCount++;
    }

    return {
      success: true,
      reverted: revertedCount,
    };
  }

  async reviertGet(
    shopId: string,
    serviceName: string,
    filters?: any,
    productIds?: string[],
  ) {
    const shop = await this.shopModel.findById(shopId).lean();
    if (!shop) throw new Error('Invalid shop');

    const finalProductIds = await this.getProductIds(
      shop,
      filters,
      productIds,
    );

    switch (serviceName) {
      case 'title':
        return this.getRevertData(
          this.titleModel,
          shopId,
          finalProductIds,
        );

      case 'description':
        return this.getRevertData(
          this.descriptionModel,
          shopId,
          finalProductIds,
        );
      case 'metaTitle':
        return this.getRevertData(
          this.metaTitleModel,
          shopId,
          finalProductIds,
        );
      case 'metaDescription':
        return this.getRevertData(
          this.metaDescriptionModel,
          shopId,
          finalProductIds,
        );
      case 'handle':
        return this.getRevertData(
          this.metaHandleModel,
          shopId,
          finalProductIds,
        );

      default:
        throw new Error('Invalid serviceName');
    }
  }

  /* ---------------------------------------------------- */
  /* SAVE REVERT                                          */
  /* ---------------------------------------------------- */

  async revertSave(
    shopId: string,
    serviceName: string,
    filters?: any,
    productIds?: string[],
  ) {
    const shop = await this.shopModel.findById(shopId).lean();
    if (!shop) throw new Error('Invalid shop');

    const finalProductIds = await this.getProductIds(
      shop,
      filters,
      productIds,
    );

    switch (serviceName) {
      case 'title':
        return this.revertProducts(
          this.titleModel,
          shop,
          shopId,
          finalProductIds,
          UPDATE_PRODUCT_TITLE_MUTATION,
          'title',
        );

      case 'description':
        return this.revertProducts(
          this.descriptionModel,
          shop,
          shopId,
          finalProductIds,
          UPDATE_PRODUCT_DESCRIPTION_MUTATION,
          'descriptionHtml',
        );
      case 'metaTitle':
        return this.revertProducts(
          this.metaTitleModel,
          shop,
          shopId,
          finalProductIds,
          UPDATE_PRODUCT_META_MUTATION,
          'seo.title',
        );
      case 'metaDescription':
        return this.revertProducts(
          this.metaDescriptionModel,
          shop,
          shopId,
          finalProductIds,
          UPDATE_PRODUCT_META_MUTATION,
          'seo.description',
        );
      case 'handle':
        return this.revertProducts(
          this.metaHandleModel,
          shop,
          shopId,
          finalProductIds,
          UPDATE_PRODUCT_Handle_MUTATION,
          'handle',
        );

      default:
        throw new Error('Invalid serviceName');
    }
  }
}