export function buildProductTypePrompt(product: any) {

  return `
You are an expert Shopify SEO optimizer.

Based on the product information below, generate the BEST product type.

Rules:
- Use clear ecommerce category names
- 1-3 words maximum
- Must be SEO friendly
- Must match Shopify product categorization
- Do not include brand name

Product Title: ${product.title}
Vendor: ${product.vendor}
Tags: ${product.tags}
Current Product Type: ${product.productType}

Return ONLY the optimized product type.
`;
}