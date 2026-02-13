import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Shop } from 'src/schema/shop.schema';
import { ShopifyService } from 'src/common/shopify/shopify.service';
import { PRODUCT_VARIANTS_PRICING_QUERY } from 'src/graphql/product-pricing.query';
import { UPDATE_VARIANT_PRICING_MUTATION } from 'src/graphql/update-variant-pricing.mutation';
import { CalculatePricingDto } from 'src/dto/pricing/calculate-pricing.dto';
import { ApplyPricingDto } from 'src/dto/pricing/apply-pricing.dto';
import { PricingHistory } from 'src/schema/pricing/pricing-history.schema';

@Injectable()
export class PricingService {
    constructor(
        private readonly shopifyService: ShopifyService,
        @InjectModel(Shop.name) private shopModel: Model<Shop>,
        @InjectModel(PricingHistory.name)
        private pricingHistoryModel: Model<PricingHistory>,
    ) { }

    // =====================================================
    // 🔥 PRICE CALCULATION LOGIC
    // =====================================================
    private calculateVariantPrice(
        cost: number,
        minProfit: number,
        discount = 0,
    ) {
        const requiredPrice = cost * (1 + minProfit / 100);

        let price = requiredPrice;
        let compareAtPrice: number | null = null;

        if (discount > 0) {
            compareAtPrice = price / (1 - discount / 100);
        }

        return {
            price: Number(price.toFixed(2)),
            compareAtPrice: compareAtPrice
                ? Number(compareAtPrice.toFixed(2))
                : null,
            profit: Number((price - cost).toFixed(2)),
        };
    }

    // =====================================================
    // 💾 SAVE PRICING HISTORY
    // =====================================================
    private async savePricingHistory(data: {
        shopId: string;
        productId: string;
        productTitle: string;
        variants: any[];
        minProfit: number;
        discount: number;
    }) {
        return this.pricingHistoryModel.create(data);
    }

    // =====================================================
    // 🧠 CALCULATE ONLY (NO UPDATE)
    // =====================================================
    async calculatePricing(shopId: string, dto: CalculatePricingDto) {
        const shop = await this.shopModel.findById(shopId).lean();
        if (!shop) throw new Error('Invalid shop');

        const response = await this.shopifyService.shopifyRequest(
            shop.shopDomain,
            shop.accessToken,
            PRODUCT_VARIANTS_PRICING_QUERY,
            { id: dto.productId },
        );

        const product = response.product;
        if (!product) throw new Error('Product not found');

        const discount = dto.discount || 0;

        const variants = product.variants.edges.map(e => e.node);

        const results = variants.map(v => {
            const cost = Number(v.inventoryItem?.unitCost?.amount || 0);
            if (!cost) return null;

            const calc = this.calculateVariantPrice(
                cost,
                dto.minProfit,
                discount,
            );

            return {
                variantId: v.id,
                title: v.title,
                image: v.image?.url || null,
                costPrice: cost,
                ...calc,
            };
        });

        return {
            productId: product.id,
            title: product.title,
            minProfit: dto.minProfit,
            discount,
            variants: results.filter(Boolean),
        };
    }

async applyPricingAndStore(shopId: string, dto: ApplyPricingDto) {
  const shop = await this.shopModel.findById(shopId).lean();
  if (!shop) throw new Error('Invalid shop');

  // 🔥 get product
  const productRes = await this.shopifyService.shopifyRequest(
    shop.shopDomain,
    shop.accessToken,
    PRODUCT_VARIANTS_PRICING_QUERY,
    { id: dto.productId },
  );

  const product = productRes.product;
  if (!product) throw new Error('Product not found');

  const updatedVariants: any[] = [];

  // 🔥 UPDATE VARIANTS (NEW BULK MUTATION)
  for (const v of dto.variants) {
    const res = await this.shopifyService.shopifyRequest(
      shop.shopDomain,
      shop.accessToken,
      UPDATE_VARIANT_PRICING_MUTATION,
      {
        productId: dto.productId,
        variants: [
          {
            id: v.variantId,
            price: String(v.price),
            compareAtPrice: v.compareAtPrice
              ? String(v.compareAtPrice)
              : null,
          },
        ],
      },
    );
    console.log(JSON.stringify(res, null, 2));
    // 🔥 FIX HERE
    const errors = res.productVariantsBulkUpdate?.userErrors;
    if (errors?.length) {
      console.log('Shopify Errors:', errors);
      throw errors;
    }

    const updated = res.productVariantsBulkUpdate?.productVariants || [];
    updatedVariants.push(...updated);
  }

  // ===============================
  // SAVE HISTORY
  // ===============================
  const variantMap = product.variants.edges.map(e => e.node);

  const historyVariants = variantMap.map(v => {
    const applied = dto.variants.find(x => x.variantId === v.id);
    if (!applied) return null;

    const cost = Number(v.inventoryItem?.unitCost?.amount || 0);

    return {
      variantId: v.id,
      variantTitle: v.title,
      costPrice: cost,
      price: applied.price,
      compareAtPrice: applied.compareAtPrice || null,
      profit: Number((applied.price - cost).toFixed(2)),
    };
  });

  const saved = await this.savePricingHistory({
    shopId,
    productId: dto.productId,
    productTitle: product.title,
    variants: historyVariants.filter(Boolean),
    minProfit: dto.minProfit,
    discount: dto.discount || 0,
  });

  return {
    success: true,
    updatedCount: updatedVariants.length,
    historyId: saved._id,
    variants: updatedVariants,
  };
}

}
