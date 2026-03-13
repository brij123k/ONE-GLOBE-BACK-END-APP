export function buildProductCategoryPrompt(product:any){

return `
You are an ecommerce catalog AI.

Analyze this Shopify product and classify it.

Return strictly valid JSON with double quotes only.

Example:
{
  "l1": "Sports",
  "l1Icon": "sports-icon(as a emoji)",
  "l2": "Winter Sports",
  "l2Icon": "snowflake-icon(as a emoji)",
  "confidence": 0.95
}

Product Title: ${product.title}
Vendor: ${product.vendor}
Product Type: ${product.productType}
Tags: ${product.tags}

Return JSON only.
`;

}