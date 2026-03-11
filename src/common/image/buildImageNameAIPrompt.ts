export function buildImageNameAIPrompt(
  product: any,
  image: any,
  dto: any,
) {
  return `
Generate an SEO optimized image filename.

Product Title: ${product.title}
Vendor: ${product.vendor}
Product Type: ${product.productType}

Rules:
- Use lowercase
- Use hyphens instead of spaces
- Max 6 words
- No special characters
- No extension

Example:
nike-running-shoes

Return ONLY filename.
`;
}