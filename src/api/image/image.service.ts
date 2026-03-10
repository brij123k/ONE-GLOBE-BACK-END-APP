import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';

import { Shop } from 'src/schema/shop.schema';
import { UpdateImageAltDto } from 'src/dto/image/update-image-alt.dto';
import { UPDATE_IMAGE_ALT_MUTATION } from 'src/graphql/update-image-alt.mutation';
import { ImageAltHistory } from 'src/schema/image/image-alt-history.schema';
import { CREATE_PRODUCT_IMAGE_MUTATION } from 'src/graphql/create-product-image.mutation';
import { DELETE_IMAGE_MUTATION } from 'src/graphql/delete-image.mutation';
import { UpdateImageNameDto } from 'src/dto/image/update-image-name.dto';
import { ImageNameHistory } from 'src/schema/image/image-name-history.schema';

export interface ImageAltResult {
    imageId: string;
    status: 'updated' | 'skipped' | 'failed' | 'error';
}

@Injectable()
export class ImageService {

    constructor(
        @InjectModel(Shop.name)
        private shopModel: Model<Shop>,

        @InjectModel(ImageAltHistory.name)
        private imageAltHistoryModel: Model<ImageAltHistory>,

        @InjectModel(ImageNameHistory.name)
        private imageNameHistoryModel: Model<ImageNameHistory>,
    ) { }


    private getImageExtension(url: string): string {

        try {

            const cleanUrl = url.split('?')[0];
            const parts = cleanUrl.split('.');
            return parts[parts.length - 1];

        } catch {
            return 'jpg';
        }

    }

    private async getShop(shopId: string) {
        const shop = await this.shopModel.findById(shopId).lean();
        if (!shop) throw new Error('Invalid shop');
        return shop;
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

    async updateImageAlt(shopId: string, dto: UpdateImageAltDto) {

        const shop = await this.getShop(shopId);

        const results: ImageAltResult[] = [];

        for (const item of dto.updates) {

            if (item.oldAlt === item.newAlt) {

                results.push({
                    imageId: item.imageId,
                    status: 'skipped',
                });

                continue;
            }

            try {

                const response = await this.shopifyRequest(
                    shop.shopDomain,
                    shop.accessToken,
                    UPDATE_IMAGE_ALT_MUTATION,
                    {
                        files: [
                            {
                                id: item.imageId,
                                alt: item.newAlt,
                            },
                        ],
                    },
                );

                const errors = response.fileUpdate.userErrors;

                if (errors?.length) {

                    console.error('ALT UPDATE ERROR:', errors);

                    results.push({
                        imageId: item.imageId,
                        status: 'failed',
                    });

                    continue;
                }

                await this.imageAltHistoryModel.create({
                    shopId,
                    productId: item.productId,
                    imageId: item.imageId,
                    oldAlt: item.oldAlt,
                    newAlt: item.newAlt,
                });

                results.push({
                    imageId: item.imageId,
                    status: 'updated',
                });

            } catch (error) {

                console.error('IMAGE ALT ERROR:', error);

                results.push({
                    imageId: item.imageId,
                    status: 'error',
                });

            }

        }

        return {
            message: 'Image ALT update completed',
            updatedCount: results.filter(r => r.status === 'updated').length,
            results,
        };

    }


    async updateImageName(shopId: string, dto: UpdateImageNameDto) {

        const shop = await this.getShop(shopId);

        const results: {
            imageId: string;
            status: 'updated' | 'failed' | 'error';
        }[] = [];

        for (const item of dto.updates) {

            try {

                // extract extension from original URL
                const extension = this.getImageExtension(item.imageUrl);

                const newFileName = `${item.newName}.${extension}`;

                const uploadResponse = await this.shopifyRequest(
                    shop.shopDomain,
                    shop.accessToken,
                    CREATE_PRODUCT_IMAGE_MUTATION,
                    {
                        productId: item.productId,
                        media: [
                            {
                                originalSource: item.imageUrl,
                                mediaContentType: "IMAGE",
                                filename: newFileName,
                            }
                        ]
                    }
                );

                const errors = uploadResponse.productCreateMedia.mediaUserErrors;

                if (errors?.length) {

                    console.error("IMAGE NAME UPDATE ERROR:", errors);

                    results.push({
                        imageId: item.imageId,
                        status: "failed"
                    });

                    continue;
                }

                // delete old image
                await this.shopifyRequest(
                    shop.shopDomain,
                    shop.accessToken,
                    DELETE_IMAGE_MUTATION,
                    {
                        fileIds: [item.imageId]
                    }
                );

                // save history for revert
                await this.imageNameHistoryModel.create({
                    shopId,
                    productId: item.productId,
                    imageId: item.imageId,
                    imageUrl: item.imageUrl,
                    oldName: item.oldName,
                    newName: item.newName,
                    oldExtension: extension,
                });

                results.push({
                    imageId: item.imageId,
                    status: "updated"
                });

            } catch (error) {

                console.error("IMAGE NAME UPDATE ERROR:", error);

                results.push({
                    imageId: item.imageId,
                    status: "error"
                });

            }

        }

        return {
            message: "Image name update completed",
            updatedCount: results.filter(r => r.status === "updated").length,
            results
        };

    }

}