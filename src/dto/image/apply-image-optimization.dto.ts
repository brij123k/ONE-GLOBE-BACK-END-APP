export class ApplyImageOptimizationDto {
  productId: string;

  images: {
    imageGraphqlId: string; // REQUIRED
    newAlt: string;
    newFilename?: string;
  }[];
}
