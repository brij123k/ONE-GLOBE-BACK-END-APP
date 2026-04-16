import { Schema, Document } from 'mongoose';

export class DeleteProduct extends Document {
  shopifyId: string;
  title: string;
  description: string;
  vendor: string;
  status: string;
  tags: string[];
  images: string[];
  variants: any[];
  options: any[];
  seo: {
    title: string;
    description: string;
  };
  collections?: string[];
  rawData: any;
}

export const DeleteProductSchema = new Schema(
  {
    shopifyId: { type: String, required: true },
    title: String,
    description: String,
    vendor: String,
    status: String,
    tags: [String],
    images: [String],
    variants: Array,
    options: Array,
    seo: {
      title: String,
      description: String,
    },
    collections: [String],
    rawData: Object,
  },
  { timestamps: true },
);