export function buildImageAltAIPrompt(
  product: any,
  image: any,
  dto: any,
) {
  return `
Generate an SEO optimized ALT text for a product image.

Product Title: ${product.title}
Vendor: ${product.vendor}
Product Type: ${product.productType}
Shop Name: ${dto.shopName}

Rules:
- Maximum 125 characters
- Describe the product clearly
- Include important keywords naturally
- Do not add quotes
- Do not repeat words
- Make it human readable

Return ONLY the alt text.
`;
}