import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeleteProduct } from 'src/schema/delete/shopify-product.schema';

@Injectable()
export class DeleteService {
  private SHOP = 'your-store.myshopify.com';
  private TOKEN = 'your-access-token';

  constructor(
    @InjectModel('DeleteProduct')
    private productModel: Model<DeleteProduct>,
  ) {}

  private get headers() {
    return {
      'X-Shopify-Access-Token': this.TOKEN,
      'Content-Type': 'application/json',
    };
  }

  // 🔹 1. FETCH + STORE PRODUCTS
  async fetchAndStoreProducts(filters: any) {
    const { status, vendor, minStock, maxStock } = filters;

    const res = await axios.get(
      `https://${this.SHOP}/admin/api/2024-01/products.json`,
      { headers: this.headers },
    );

    const products = res.data.products;

    const filtered = products.filter((p) => {
      let match = true;

      if (status) match = match && p.status === status;
      if (vendor) match = match && p.vendor === vendor;

      if (minStock || maxStock) {
        const totalStock = p.variants.reduce(
          (sum, v) => sum + (v.inventory_quantity || 0),
          0,
        );

        if (minStock) match = match && totalStock >= minStock;
        if (maxStock) match = match && totalStock <= maxStock;
      }

      return match;
    });

    // Save in DB
    for (const p of filtered) {
      await this.productModel.create({
        shopifyId: p.id,
        title: p.title,
        description: p.body_html,
        vendor: p.vendor,
        status: p.status,
        tags: p.tags ? p.tags.split(',') : [],
        images: p.images.map((img) => img.src),
        variants: p.variants,
        options: p.options,
        seo: {
          title: p.title,
          description: p.body_html,
        },
        rawData: p,
      });
    }

    return {
      count: filtered.length,
      message: 'Products stored successfully',
    };
  }

  // 🔹 2. DELETE FROM SHOPIFY
  async deleteStoredProductsFromShopify() {
    const products = await this.productModel.find();

    for (const p of products) {
      await axios.delete(
        `https://${this.SHOP}/admin/api/2024-01/products/${p.shopifyId}.json`,
        { headers: this.headers },
      );
    }

    return { message: 'All products deleted from Shopify' };
  }

  // 🔹 3. RESTORE PRODUCTS
  async restoreProductsToShopify() {
    const products = await this.productModel.find();

    for (const p of products) {
      await axios.post(
        `https://${this.SHOP}/admin/api/2024-01/products.json`,
        {
          product: {
            title: p.title,
            body_html: p.description,
            vendor: p.vendor,
            tags: p.tags.join(','),
            status: p.status,
            variants: p.variants,
            options: p.options,
            images: p.images.map((src) => ({ src })),
          },
        },
        { headers: this.headers },
      );
    }

    return { message: 'Products restored to Shopify' };
  }
}